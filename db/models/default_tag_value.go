package models

import (
	"time"
)

// DefaultTagValue holds information about a tag value that is common to
// all bags.
type DefaultTagValue struct {
	Id        int64     `db:"id" form_options:"skip"`
	ProfileId *int      `db:"profile_id" form_widget:"hidden"`
	TagFile   string    `db:"tag_file"`
	TagName   string    `db:"tag_name"`
	TagValue  string    `db:"tag_value"`
	UpdatedAt time.Time `db:"updated_at" form_widget:"static"`
	errors    []string
}

// PrimaryKey() returns this object's Id, to conform to the Model interface.
func (value *DefaultTagValue) PrimaryKey() int64 {
	return value.Id
}

// TableName returns the name of the database table where this model's
// records are stored.
func (value *DefaultTagValue) TableName() string {
	return "default_tag_values"
}

// Validate runs validation checks on the object and returns true if
// the object is valid. If this returns false, check Errors().
func (value *DefaultTagValue) Validate() bool {
	value.initErrors(true)
	return true
}

// Save saves the object to the database. If validate is true,
// it validates before saving. After a successful save, the object
// will have a non-zero Id. If this returns false, check Errors().
func (value *DefaultTagValue) Save(validate bool) bool {
	if !value.Validate() {
		return false
	}
	db := GetConnection(DEFAULT_CONNECTION)
	tx, err := db.Beginx()
	if err != nil {
		value.addError(err.Error())
		return false
	}
	//tx.NamedExec(statement, value)
	tx.Commit()
	return true
}

// Errors returns a list of errors that occurred after a call to Validate()
// or Save().
func (value *DefaultTagValue) Errors() []string {
	value.initErrors(false)
	return value.errors
}

// initErrors initializes the errors list. If param clearExistingList
// is true, it replaces the existing errors list with a blank list.
func (value *DefaultTagValue) initErrors(clearExistingList bool) {
	if value.errors == nil || clearExistingList {
		value.errors = make([]string, 0)
	}
}

// addError adds an error message to the errors list.
func (value *DefaultTagValue) addError(message string) {
	value.errors = append(value.errors, message)
}
