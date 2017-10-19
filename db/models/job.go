package models

import (
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"time"
)

type Job struct {
	gorm.Model         `form_options:"skip"`
	BagID              int64     `form_options:"skip"`
	Bag                Bag       `form_options:"skip"`
	FileID             int64     `form_options:"skip"`
	WorkflowID         int64     `form_widget:"select"`
	Workflow           Workflow  `form_options:"skip"`
	WorkflowSnapshot   string    `form_options:"skip"`
	ScheduledStartTime time.Time `form_options:"skip"`
	StartedAt          time.Time `form_options:"skip"`
	FinishedAt         time.Time `form_options:"skip"`
	Pid                int       `form_options:"skip"`
	Outcome            string    `form_options:"skip"`
	CapturedOutput     string    `form_options:"skip"`
}

func JobLoad(db *gorm.DB, id int64) (*Job, error) {
	job := &Job{}
	err := db.First(job, id).Error
	return job, err
}

func JobLoadWithRelations(db *gorm.DB, id int64) (*Job, error) {
	job, err := JobLoad(db, id)
	if err == nil {
		err = db.Preload("BagItProfile", "StorageService").First(&job.Workflow, job.WorkflowID).Error
	}
	return job, err
}
