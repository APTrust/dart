package workers

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"io"
)

type JobRunner struct {
	Job            *models.Job
	LogWriter      io.Writer
	Errors         []string
	workflow       *models.Workflow
	profile        *models.BagItProfile
	storageService *models.StorageService
	bag            *models.Bag
	file           *models.File
	files          []*models.File
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

// BuildBag assembles JobRunner.Bag.Files() into a bag using the
// BagItProfile specified in JobRunner.Job.Profile(). If there's
// no bag or profile specified, this is a no-op.
func (r JobRunner) BuildBag() bool {
	if r.profile && r.bag {

	}
	return true
}

// SerializeBag serializes the bag to the specified format.
// Currently, tar is the only supported format.
func (r JobRunner) SerializeBag() bool {
	if r.workflow.SerializationFormat == "tar" {

	}
	return true
}

// CopyBagToRemote copies the bag to the remote storage area.
// For now, only S3 is supported. In future, we may add SFTP
// and other protocols.
func (r JobRunner) CopyBagToRemote() bool {
	if r.storageService != nil {

	}
	return true
}

func (r JobRunner) ConfigDataOk() bool {
	if r.Job == nil {
		r.AddError("Job cannot be null")
		return false
	}
	var err error
	r.workflow, err = r.Job.Workflow()
	if r.workflow == nil {
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
	r.profile, err = r.workflow.Profile()
	if err != nil {
		r.AddError("Cannot retrieve BagIt profile for this workflow: %v", err)
		return false
	}
	r.storageService, err = r.workflow.StorageService()
	if err != nil {
		r.AddError("Cannot retrieve storage service for this workflow: %v", err)
		return false
	}
	r.bag, err = r.Job.Bag()
	if err != nil {
		r.AddError("Cannot retrieve the bag record for this job: %v", err)
		return false
	}
	// File will only exist if the Workflow does not include any
	// bagging. In that case, the Workflow is to copy the specified
	// file to the storage service.
	r.file, err = r.Job.File()
	if err != nil {
		r.AddError("Cannot retrieve the file record for this job: %v", err)
		return false
	}

	// The presence of a BagItProfile indicates that the job
	// includes creating a bag. The presence of a StorageService
	// indicates that the job includes copying a bag or file to
	// the remote storage service.
	if r.profile == nil && r.storageService == nil {
		r.AddError("This workflow has no BagIt profile and no storage service, so there " +
			"is nothing to do.")
		return false
	}
	if r.profile != nil && r.bag == nil {
		r.AddError("This workflow includes a bagging task, but the bag record is missing.")
		return false
	}
	if r.storageService != nil && r.bag == nil && r.file == nil {
		r.AddError("This workflow includes an upload task, but no bag or file is specified.")
		return false
	}
	if r.bag != nil {
		r.files, err = r.bag.Files()
		if err != nil {
			r.AddError("Cannot get files for bag %s: %s", r.bag.Name, err.Error())
			return false
		} else if len(r.files) == 0 {
			r.AddError("Bag %s has no files.", r.bag.Name)
			return false
		}
	}
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
