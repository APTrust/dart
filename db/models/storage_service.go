package models

import (
	"github.com/jmoiron/sqlx"
)

// StorageService holds information about how to connect to a remote
// storage service.
type StorageService struct {
	Id             int    `db:"id"`
	Name           string `db:"name"`
	Description    string `db:"description"`
	Protocol       string `db:"protocol"`
	BucketOrFolder string `db:"bucket_or_folder"`
	CredentialsId  *int   `db:"credentials_id"`
}

func NewStorageServiceFromRow() (*StorageService, error) {
	return nil, nil
}

func NewStorageServiceFromMap() (*StorageService, error) {
	return nil, nil
}

func (setting *StorageService) Validate() (bool, []error) {
	return true, nil
}

func (setting *StorageService) Save(db *sqlx.DB) (*StorageService, error) {
	// Insert if Id is zero, otherwise update.
	// Return setting with Id.
	return setting, nil
}

func (setting *StorageService) Credentials() *Credentials {
	// Load from CredentialsId, if that's not nil.
	return nil
}
