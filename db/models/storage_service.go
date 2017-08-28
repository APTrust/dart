package models

import (
	"strings"
)

// StorageService holds information about how to connect to a remote
// storage service.
type StorageService struct {
	Id             int64    `db:"id" form_options:"skip"`
	Name           string   `db:"name"`
	Description    string   `db:"description"`
	Protocol       string   `db:"protocol"`
	URL            string   `db:"url"`
	BucketOrFolder string   `db:"bucket_or_folder" form_label:"Folder or Bucket Name"`
	LoginName      string   `db:"login_name" form_label:"Login Name or S3 Key Id"`
	LoginPassword  string   `db:"login_password" form_label:"Password or S3 Secret Key"`
	LoginExtra     string   `db:"login_extra" form_label:"Additional Login Info"`
	errors         []string `form_options:"skip"`
}

// GetStorageService returns the service with the specified id, or an error if the
// service does not exist.
func GetStorageService(id int64) (*StorageService, error) {
	service := &StorageService{Id: id}
	query := SelectByIdQuery(service)
	db := GetConnection(DEFAULT_CONNECTION)
	err := db.Get(service, query, id)
	if err == nil {
		return service, err
	}
	return nil, err
}

// GetStorageServices returns the services matching the criteria specified in where.
// The values param should be a map of values reference in the
// where clause.
//
// For example:
//
// where := "name = ? and age = ?"
// values := []interface{} { "Billy Bob Thornton", 62 }
// services, err := GetStorageServices(where, values)
func GetStorageServices(where string, values []interface{}) ([]*StorageService, error) {
	service := &StorageService{}
	var query string
	if strings.TrimSpace(where) != "" {
		query = SelectWhere(service, where)
	} else {
		query = SelectQuery(service)
	}
	services := make([]*StorageService, 0)
	db := GetConnection(DEFAULT_CONNECTION)
	err := db.Select(&services, query, values...)
	return services, err
}

// Save saves the object to the database. If validate is true,
// it validates before saving. After a successful save, the object
// will have a non-zero Id. If this returns false, check Errors().
func (service *StorageService) Save(validate bool) bool {
	return SaveObject(service)
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
