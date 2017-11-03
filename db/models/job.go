package models

import (
	"fmt"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"net/http"
	"net/url"
	"time"
)

type Job struct {
	gorm.Model
	BagID          uint
	Bag            Bag
	FileID         uint
	File           File
	BagItProfileID uint
	BagItProfile   BagItProfile
	StartedAt      time.Time
	FinishedAt     time.Time
	Pid            int
	Outcome        string
	CapturedOutput string
	Errors         map[string]string `sql:"-"`
}

func NewJob() *Job {
	return &Job{}
}

// JobLoad loads a job without any of its relations.
func JobLoad(db *gorm.DB, id uint) (*Job, error) {
	job := &Job{}
	err := db.First(job, id).Error
	return job, err
}

// JobLoadWithRelations loads a job with all of its relations
// and all of their sub-relations, all the way down. This includes
// all the info you need to actually run a job.
func JobLoadWithRelations(db *gorm.DB, id uint) (*Job, error) {
	job := &Job{}
	err := db.Preload("Bag").Preload("File").Preload("BagItProfile").First(job, id).Error
	if err == nil && job != nil && job.BagItProfile.ID > 0 {
		defaultTagValues := make([]DefaultTagValue, 0)
		err = db.Where("bag_it_profile_id = ?", job.BagItProfile.ID).Find(&defaultTagValues).Error
		if err == nil {
			job.BagItProfile.DefaultTagValues = defaultTagValues
		}
	}
	return job, err
}

func (job *Job) IsValid() bool {
	job.Errors = make(map[string]string)
	if job.Bag.ID == 0 && job.File.ID == 0 {
		job.Errors["Bag"] = "Job must have either a bag or a file."
		job.Errors["File"] = "Job must have either a bag or a file."
	}
	return len(job.Errors) > 0
}

// TODO: Move db into package-level var, so we don't have to keep
// passing it. It's making signatures inconsistent and is otherwise
// generally annoying.
func (job *Job) Form(db *gorm.DB) (*Form, error) {
	action := "/job/new" // "/job/run"
	method := "post"
	if job.ID != 0 {
		action = fmt.Sprintf("/job/%d/edit", job.ID)
	}
	form := NewForm(action, method)

	form.Fields["BagItProfile"] = NewField("BagItProfile", "bagItProfile", "Profile",
		fmt.Sprintf("%d", job.BagItProfile.ID))
	form.Fields["BagItProfile"].Choices = ProfileOptions(db)

	// Fields for BagIt tags
	if job.BagItProfile.ID != 0 {
		fields, err := job.BagItProfile.BuildTagValueFields()
		if err != nil {
			return nil, err
		}
		for _, field := range fields {
			form.Fields[field.Name] = field
		}
		form.Fields["BagName"] = NewField("BagName", "BagName", "Bag Name", job.Bag.Name)
	}

	form.SetErrors(job.Errors)
	return form, nil
}

func JobFromRequest(db *gorm.DB, method string, id uint, values url.Values) (*Job, error) {
	// This will often legitimately be empty/zero.
	bagName := values.Get("BagName")
	job := NewJob()
	var err error
	if method == http.MethodGet && id != uint(0) {
		job, err = JobLoadWithRelations(db, id)
	}
	if bagName != "" {
		job.Bag.Name = bagName
	}
	return job, err
}
