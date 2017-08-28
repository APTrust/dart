package models

import (
	"strings"
)

// Credentials holds information about credentials needed to connect
// to remote storage services, REST APIs, etc.
type Credentials struct {
	Id          int64  `db:"id" form_options:"skip"`
	Name        string `db:"name"`
	Description string `db:"description"`
	Key         string `db:"key"`
	Value       string `db:"value"`
	errors      []string
}

// GetCredentials returns the credentials with the specified id, or an error if the
// credentials does not exist.
func GetCredential(id int64) (*Credentials, error) {
	credentials := &Credentials{Id: id}
	query := SelectByIdQuery(credentials)
	db := GetConnection(DEFAULT_CONNECTION)
	err := db.Get(credentials, query, id)
	if err == nil {
		return credentials, err
	}
	return nil, err
}

// GetCredentials returns the credentials matching the criteria specified in where.
// The values param should be a map of values reference in the
// where clause.
//
// For example:
//
// where := "name = ? and age = ?"
// values := []interface{} { "Billy Bob Thornton", 62 }
// credentials, err := GetCredentials(where, values)
func GetCredentials(where string, values []interface{}) ([]*Credentials, error) {
	credential := &Credentials{}
	var query string
	if strings.TrimSpace(where) != "" {
		query = SelectWhere(credential, where)
	} else {
		query = SelectQuery(credential)
	}
	credentials := make([]*Credentials, 0)
	db := GetConnection(DEFAULT_CONNECTION)
	err := db.Select(&credentials, query, values...)
	return credentials, err
}

// Save saves the object to the database. If validate is true,
// it validates before saving. After a successful save, the object
// will have a non-zero Id. If this returns false, check Errors().
func (credentials *Credentials) Save(validate bool) bool {
	return SaveObject(credentials)
}

// GetId() returns this object's Id, to conform to the Model interface.
func (credentials *Credentials) GetId() int64 {
	return credentials.Id
}

// SetId() sets this object's Id.
func (credentials *Credentials) SetId(id int64) {
	credentials.Id = id
}

// TableName returns the name of the database table where this model's
// records are stored.
func (credentials *Credentials) TableName() string {
	return "credentials"
}

// Validate runs validation checks on the object and returns true if
// the object is valid. If this returns false, check Errors().
func (credentials *Credentials) Validate() bool {
	credentials.initErrors(true)
	return true
}

// Errors returns a list of errors that occurred after a call to Validate()
// or Save().
func (credentials *Credentials) Errors() []string {
	credentials.initErrors(false)
	return credentials.errors
}

// initErrors initializes the errors list. If param clearExistingList
// is true, it replaces the existing errors list with a blank list.
func (credentials *Credentials) initErrors(clearExistingList bool) {
	if credentials.errors == nil || clearExistingList {
		credentials.errors = make([]string, 0)
	}
}

// AddError adds an error message to the errors list.
func (credentials *Credentials) AddError(message string) {
	credentials.errors = append(credentials.errors, message)
}
