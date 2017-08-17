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
	Id                 int64     `db:"id" form_options:"skip"`
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
	errors             []string
}

// PrimaryKey() returns this object's Id, to conform to the Model interface.
func (job *Job) PrimaryKey() int64 {
	return job.Id
}

// TableName returns the name of the database table where this model's
// records are stored.
func (job *Job) TableName() string {
	return "jobs"
}

// Validate runs validation checks on the object and returns true if
// the object is valid. If this returns false, check Errors().
func (job *Job) Validate() bool {
	job.initErrors(true)
	return true
}

// Save saves the object to the database. If validate is true,
// it validates before saving. After a successful save, the object
// will have a non-zero Id. If this returns false, check Errors().
func (job *Job) Save(validate bool) bool {
	if !job.Validate() {
		return false
	}
	db := GetConnection(DEFAULT_CONNECTION)
	tx, err := db.Beginx()
	if err != nil {
		job.addError(err.Error())
		return false
	}
	//tx.NamedExec(statement, job)
	tx.Commit()
	return true
}

// Errors returns a list of errors that occurred after a call to Validate()
// or Save().
func (job *Job) Errors() []string {
	job.initErrors(false)
	return job.errors
}

// initErrors initializes the errors list. If param clearExistingList
// is true, it replaces the existing errors list with a blank list.
func (job *Job) initErrors(clearExistingList bool) {
	if job.errors == nil || clearExistingList {
		job.errors = make([]string, 0)
	}
}

// addError adds an error message to the errors list.
func (job *Job) addError(message string) {
	job.errors = append(job.errors, message)
}
