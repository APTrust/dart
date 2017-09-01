package workers

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"io"
)

type JobRunner struct {
	Job       *models.Job
	LogWriter io.Writer
	Errors    []string
}

// TODO: track progress of bagging & upload

func NewJobRunner(job *models.Job, logWriter io.Writer) *JobRunner {
	return &JobRunner{
		Job:       job,
		LogWriter: logWriter,
	}
}

func (r JobRunner) Run() bool {
	if !r.ConfigDataOk() {
		return false
	}
	return true
}

func (r JobRunner) ConfigDataOk() bool {
	if r.Job == nil {
		r.AddError("Job cannot be null")
		return false
	}
	workflow, err := r.Job.Workflow()
	if workflow == nil {
		if err != nil {
			r.AddError("Cannot retrieve workflow: %v", err)
		} else {
			r.AddError("Cannot run job without workflow")
		}
		return false
	}
	// We'll get an error only if profile is set and is not
	// retrievable. There will be no error if the
	// workflow.ProfileId is nil. The same goes for the calls
	// to StorageService(), Bag(), and File().
	profile, err := workflow.Profile()
	if err != nil {
		r.AddError("Cannot retrieve BagIt profile for this workflow: %v", err)
		return false
	}
	storageService, err := workflow.StorageService()
	if err != nil {
		r.AddError("Cannot retrieve storage service for this workflow: %v", err)
		return false
	}
	bag, err := r.Job.Bag()
	if err != nil {
		r.AddError("Cannot retrieve the bag record for this job: %v", err)
		return false
	}
	// File will only exist if the Workflow does not include any
	// bagging. In that case, the Workflow is to copy the specified
	// file to the storage service.
	file, err := r.Job.File()
	if err != nil {
		r.AddError("Cannot retrieve the file record for this job: %v", err)
		return false
	}

	// The presence of a BagItProfile indicates that the job
	// includes creating a bag. The presence of a StorageService
	// indicates that the job includes copying a bag or file to
	// the remote storage service.
	if profile == nil && storageService == nil {
		r.AddError("This workflow has no BagIt profile and no storage service, so there " +
			"is nothing to do.")
		return false
	}
	if profile != nil && bag == nil {
		r.AddError("This workflow includes a bagging task, but the bag record is missing.")
		return false
	}
	if storageService != nil && bag == nil && file == nil {
		r.AddError("This workflow includes an upload task, but no bag or file is specified.")
		return false
	}

	// TODO: if bag is specified, make sure it has files.

	return true
}

func (r JobRunner) AddError(format string, a ...interface{}) {
	msg := fmt.Sprintf(format, a...)
	r.Errors = append(r.Errors, msg)
	r.Log(format, a...)
}

func (r JobRunner) Log(format string, a ...interface{}) {
	if r.LogWriter != nil {
		msg := fmt.Sprintf(format, a...) + "\n"
		r.LogWriter.Write([]byte(msg))
	}
}
