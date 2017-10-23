package models

import (
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"time"
)

type Job struct {
	gorm.Model         `form_options:"skip"`
	BagID              uint      `form_options:"skip"`
	Bag                Bag       `form_options:"skip"`
	FileID             uint      `form_options:"skip"`
	File               File      `form_options:"skip"`
	WorkflowID         uint      `form_widget:"select"`
	Workflow           Workflow  `form_options:"skip"`
	WorkflowSnapshot   string    `form_options:"skip"`
	ScheduledStartTime time.Time `form_options:"skip"`
	StartedAt          time.Time `form_options:"skip"`
	FinishedAt         time.Time `form_options:"skip"`
	Pid                int       `form_options:"skip"`
	Outcome            string    `form_options:"skip"`
	CapturedOutput     string    `form_options:"skip"`
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
	var workflow *Workflow
	job := &Job{}
	err := db.Preload("Bag").Preload("File").First(job, id).Error
	if err == nil {
		workflow, err = WorkflowLoadWithRelations(db, job.WorkflowID)
		if workflow != nil {
			job.Workflow = *workflow
		}
	}
	return job, err
}
