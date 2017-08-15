package models

import (
	"github.com/jmoiron/sqlx"
)

// StorageService holds information about how to connect to a remote
// storage service.
type StorageService struct {
	Id             int    `db:"id" form_options:"skip"`
	Name           string `db:"name"`
	Description    string `db:"description"`
	Protocol       string `db:"protocol"`
	BucketOrFolder string `db:"bucket_or_folder"`
	CredentialsId  *int   `db:"credentials_id"`
}

// PrimaryKey() returns this object's Id, to conform to the Model interface.
func (service *StorageService) PrimaryKey() int {
	return service.Id
}

func (service *StorageService) Validate() (bool, []error) {
	return true, nil
}

func (service *StorageService) Save(db *sqlx.DB) (*StorageService, error) {
	// Insert if Id is zero, otherwise update.
	// Return service with Id.
	return service, nil
}

func (service *StorageService) Credentials() *Credentials {
	// Load from CredentialsId, if that's not nil.
	return nil
}
