package models

import (
	"time"
)

// *** See types.JSONText for WorkflowSnapshot ***

// Job holds information about a job that easy-store will or did
// perform. A job is a workflow executed on a specific object.
// For example, a job may be the workflow "create APTrust bag and
// upload to S3" executed against the directory "my_photos",
// where my_photos is bagged and uploaded to S3.
type Job struct {
	Id                 int       `db:"id" form_options:"skip"`
	BagId              *int      `db:"bag_id"`
	FileId             *int      `db:"file_id"`
	WorkflowId         *int      `db:"workflow_id"`
	WorkflowSnapshot   string    `db:"workflow_snapshot"`
	CreatedAt          time.Time `db:"created_at"`
	ScheduledStartTime time.Time `db:"scheduled_start_time"`
	StartedAt          time.Time `db:"started_at"`
	FinishedAt         time.Time `db:"finished_at"`
	Pid                int       `db:"pid"`
	Outcome            string    `db:"outcome"`
	CapturedOutput     string    `db:"captured_output"`
}

// PrimaryKey() returns this object's Id, to conform to the Model interface.
func (job *Job) PrimaryKey() int {
	return job.Id
}

func (job *Job) Validate() (bool, []error) {
	return true, nil
}

func (job *Job) Save(validate bool) (*Job, error) {
	// Validate
	db := GetConnection(DEFAULT)
	tx, err := db.Beginx()
	if err != nil {
		return nil, err
	}
	//tx.NamedExec(statement, bag)
	tx.Commit()

	return job, nil
}
