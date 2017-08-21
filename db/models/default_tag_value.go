package models

import (
	"strings"
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

// GetDefaultTagValue returns the defaultTagValue with the specified id, or an error if the
// defaultTagValue does not exist.
func GetDefaultTagValue(id int64) (*DefaultTagValue, error) {
	defaultTagValue := &DefaultTagValue{Id: id}
	query := SelectByIdQuery(defaultTagValue)
	db := GetConnection(DEFAULT_CONNECTION)
	err := db.Get(defaultTagValue, query, id)
	return defaultTagValue, err
}

// GetDefaultTagValues returns the defaultTagValues matching the criteria specified in where.
// The values param should be a map of values reference in the
// where clause.
//
// For example:
//
// where := "name = ? and age = ?"
// values := []interface{} { "Billy Bob Thornton", 62 }
// defaultTagValues, err := GetDefaultTagValues(where, values)
func GetDefaultTagValues(where string, values []interface{}) ([]*DefaultTagValue, error) {
	defaultTagValue := &DefaultTagValue{}
	var query string
	if strings.TrimSpace(where) != "" {
		query = SelectWhere(defaultTagValue, where)
	} else {
		query = SelectQuery(defaultTagValue)
	}
	defaultTagValues := make([]*DefaultTagValue, 0)
	db := GetConnection(DEFAULT_CONNECTION)
	err := db.Select(&defaultTagValues, query, values...)
	return defaultTagValues, err
}

// Save saves the object to the database. If validate is true,
// it validates before saving. After a successful save, the object
// will have a non-zero Id. If this returns false, check Errors().
func (defaultTagValue *DefaultTagValue) Save(validate bool) bool {
	return SaveObject(defaultTagValue)
}

// GetId() returns this object's Id, to conform to the Model interface.
func (value *DefaultTagValue) GetId() int64 {
	return value.Id
}

// SetId() sets this object's Id.
func (value *DefaultTagValue) SetId(id int64) {
	value.Id = id
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

// AddError adds an error message to the errors list.
func (value *DefaultTagValue) AddError(message string) {
	value.errors = append(value.errors, message)
}
