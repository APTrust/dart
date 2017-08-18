package models

import ()

// StorageService holds information about how to connect to a remote
// storage service.
type StorageService struct {
	Id             int64  `db:"id" form_options:"skip"`
	Name           string `db:"name"`
	Description    string `db:"description"`
	Protocol       string `db:"protocol"`
	BucketOrFolder string `db:"bucket_or_folder"`
	CredentialsId  *int   `db:"credentials_id"`
	errors         []string
}

// GetId() returns this object's Id, to conform to the Model interface.
func (service *StorageService) GetId() int64 {
	return service.Id
}

// SetId() sets this object's Id.
func (service *StorageService) SetId(id int64) {
	service.Id = id
}

// TableName returns the name of the database table where this model's
// records are stored.
func (service *StorageService) TableName() string {
	return "storage_services"
}

// Validate runs validation checks on the object and returns true if
// the object is valid. If this returns false, check Errors().
func (service *StorageService) Validate() bool {
	service.initErrors(true)
	return true
}

// Save saves the object to the database. If validate is true,
// it validates before saving. After a successful save, the object
// will have a non-zero Id. If this returns false, check Errors().
func (service *StorageService) Save(validate bool) bool {
	if !service.Validate() {
		return false
	}
	db := GetConnection(DEFAULT_CONNECTION)
	tx, err := db.Beginx()
	if err != nil {
		service.AddError(err.Error())
		return false
	}
	//tx.NamedExec(statement, service)
	tx.Commit()
	return true
}

// Errors returns a list of errors that occurred after a call to Validate()
// or Save().
func (service *StorageService) Errors() []string {
	service.initErrors(false)
	return service.errors
}

// initErrors initializes the errors list. If param clearExistingList
// is true, it replaces the existing errors list with a blank list.
func (service *StorageService) initErrors(clearExistingList bool) {
	if service.errors == nil || clearExistingList {
		service.errors = make([]string, 0)
	}
}

// AddError adds an error message to the errors list.
func (service *StorageService) AddError(message string) {
	service.errors = append(service.errors, message)
}

func (service *StorageService) Credentials() *Credentials {
	// Load from CredentialsId, if that's not nil.
	return nil
}
