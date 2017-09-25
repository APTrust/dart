package models

import (
	"strings"
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
	BagId              *int64    `db:"bag_id" form_options:"skip"`
	FileId             *int64    `db:"file_id" form_options:"skip"`
	WorkflowId         *int64    `db:"workflow_id" form_widget:"select" form_label:"Workflow"`
	WorkflowSnapshot   string    `db:"workflow_snapshot" form_options:"skip"`
	CreatedAt          time.Time `db:"created_at" form_options:"skip"`
	ScheduledStartTime time.Time `db:"scheduled_start_time" form_options:"skip"`
	StartedAt          time.Time `db:"started_at" form_options:"skip"`
	FinishedAt         time.Time `db:"finished_at" form_options:"skip"`
	Pid                int       `db:"pid" form_options:"skip"`
	Outcome            string    `db:"outcome" form_options:"skip"`
	CapturedOutput     string    `db:"captured_output" form_options:"skip"`
	errors             []string  ` form_options:"skip"`
}

// GetJob returns the job with the specified id, or an error if the
// job does not exist.
func GetJob(id int64) (*Job, error) {
	job := &Job{Id: id}
	query := SelectByIdQuery(job)
	db := GetConnection(DEFAULT_CONNECTION)
	err := db.Get(job, query, id)
	if err == nil {
		return job, err
	}
	return nil, err
}

// GetJobs returns the jobs matching the criteria specified in where.
// The values param should be a map of values reference in the
// where clause.
//
// For example:
//
// where := "name = ? and age = ?"
// values := []interface{} { "Billy Bob Thornton", 62 }
// jobs, err := GetJobs(where, values)
func GetJobs(where string, values []interface{}) ([]*Job, error) {
	job := &Job{}
	var query string
	if strings.TrimSpace(where) != "" {
		query = SelectWhere(job, where)
	} else {
		query = SelectQuery(job)
	}
	jobs := make([]*Job, 0)
	db := GetConnection(DEFAULT_CONNECTION)
	err := db.Select(&jobs, query, values...)
	return jobs, err
}

// Save saves the object to the database. If validate is true,
// it validates before saving. After a successful save, the object
// will have a non-zero Id. If this returns false, check Errors().
func (job *Job) Save(validate bool) bool {
	return SaveObject(job)
}

// GetId() returns this object's Id, to conform to the Model interface.
func (job *Job) GetId() int64 {
	return job.Id
}

// SetId() sets this object's Id.
func (job *Job) SetId(id int64) {
	job.Id = id
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

// AddError adds an error message to the errors list.
func (job *Job) AddError(message string) {
	job.errors = append(job.errors, message)
}

// Returns the associated workflow.
func (job *Job) Workflow() (*Workflow, error) {
	if job.WorkflowId != nil && *job.WorkflowId != 0 {
		return GetWorkflow(*job.WorkflowId)
	}
	return nil, nil
}

// Returns the associated file.
func (job *Job) File() (*File, error) {
	if job.FileId != nil && *job.FileId != 0 {
		return GetFile(*job.FileId)
	}
	return nil, nil
}

// Returns the associated bag.
func (job *Job) Bag() (*Bag, error) {
	if job.BagId != nil && *job.BagId != 0 {
		return GetBag(*job.BagId)
	}
	return nil, nil
}
