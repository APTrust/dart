package models

import ()

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

func (service *StorageService) Save(validate bool) (*StorageService, error) {
	// Validate
	db := GetConnection(DEFAULT)
	tx, err := db.Beginx()
	if err != nil {
		return nil, err
	}
	//tx.NamedExec(statement, bag)
	tx.Commit()

	return service, nil
}

func (service *StorageService) Credentials() *Credentials {
	// Load from CredentialsId, if that's not nil.
	return nil
}
