package models

import (
	"github.com/jmoiron/sqlx"
)

// Workflow holds information about how a bag should be built and
// where it should be sent.
type Workflow struct {
	Id               int    `db:"id"`
	Name             string `db:"name"`
	Description      string `db:"description"`
	ProfileId        *int   `db:"profile_id"`
	StorageServiceId *int   `db:"storage_service_id"`
}

func NewWorkflowFromRow() (*Workflow, error) {
	return nil, nil
}

func NewWorkflowFromMap() (*Workflow, error) {
	return nil, nil
}

func (setting *Workflow) Validate() (bool, []error) {
	return true, nil
}

func (setting *Workflow) Save(db *sqlx.DB) (*Workflow, error) {
	// Insert if Id is zero, otherwise update.
	// Return setting with Id.
	return setting, nil
}

func (setting *Workflow) BagItProfile() *BagItProfile {
	// Load from ProfileId, if that's not nil.
	return nil
}

func (setting *Workflow) StorageService() *StorageService {
	// Load from StorageServiceId, if that's not nil.
	return nil
}
