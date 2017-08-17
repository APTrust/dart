package models

import ()

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

// PrimaryKey() returns this object's Id, to conform to the Model interface.
func (credentials *Credentials) PrimaryKey() int64 {
	return credentials.Id
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

// Save saves the object to the database. If validate is true,
// it validates before saving. After a successful save, the object
// will have a non-zero Id. If this returns false, check Errors().
func (credentials *Credentials) Save(validate bool) bool {
	if !credentials.Validate() {
		return false
	}
	db := GetConnection(DEFAULT_CONNECTION)
	tx, err := db.Beginx()
	if err != nil {
		credentials.addError(err.Error())
		return false
	}
	//tx.NamedExec(statement, credentials)
	tx.Commit()
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

// addError adds an error message to the errors list.
func (credentials *Credentials) addError(message string) {
	credentials.errors = append(credentials.errors, message)
}
