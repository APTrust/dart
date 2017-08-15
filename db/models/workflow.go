package models

import (
	"github.com/jmoiron/sqlx"
)

// Workflow holds information about how a bag should be built and
// where it should be sent.
type Workflow struct {
	Id               int    `db:"id" form_options:"skip"`
	Name             string `db:"name"`
	Description      string `db:"description"`
	ProfileId        *int   `db:"profile_id" form_widget:"hidden"`
	StorageServiceId *int   `db:"storage_service_id" form_widget:"hidden"`
}

// PrimaryKey() returns this object's Id, to conform to the Model interface.
func (workflow *Workflow) PrimaryKey() int {
	return workflow.Id
}

func (workflow *Workflow) Validate() (bool, []error) {
	return true, nil
}

func (workflow *Workflow) Save(db *sqlx.DB) (*Workflow, error) {
	// Insert if Id is zero, otherwise update.
	// Return workflow with Id.
	return workflow, nil
}

func (workflow *Workflow) BagItProfile() *BagItProfile {
	// Load from ProfileId, if that's not nil.
	return nil
}

func (workflow *Workflow) StorageService() *StorageService {
	// Load from StorageServiceId, if that's not nil.
	return nil
}
