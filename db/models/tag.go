package models

import (
	"strings"
)

// Tag holds information about a tag in bag built by easy-store.
// A cat in the hat from the hooka store.
type Tag struct {
	Id     int64  `db:"id" form_options:"skip"`
	BagId  *int   `db:"bag_id" form_widget:"hidden"`
	Name   string `db:"name"`
	Value  string `db:"value"`
	errors []string
}

// GetTag returns the tag with the specified id, or an error if the
// tag does not exist.
func GetTag(id int64) (*Tag, error) {
	tag := &Tag{Id: id}
	query := SelectByIdQuery(tag)
	db := GetConnection(DEFAULT_CONNECTION)
	err := db.Get(tag, query, id)
	return tag, err
}

// GetTags returns the tags matching the criteria specified in where.
// The values param should be a map of values reference in the
// where clause.
//
// For example:
//
// where := "name = ? and age = ?"
// values := []interface{} { "Billy Bob Thornton", 62 }
// tags, err := GetTags(where, values)
func GetTags(where string, values []interface{}) ([]*Tag, error) {
	tag := &Tag{}
	var query string
	if strings.TrimSpace(where) != "" {
		query = SelectWhere(tag, where)
	} else {
		query = SelectQuery(tag)
	}
	tags := make([]*Tag, 0)
	db := GetConnection(DEFAULT_CONNECTION)
	err := db.Select(&tags, query, values...)
	return tags, err
}

// Save saves the object to the database. If validate is true,
// it validates before saving. After a successful save, the object
// will have a non-zero Id. If this returns false, check Errors().
func (tag *Tag) Save(validate bool) bool {
	return SaveObject(tag)
}

// GetId() returns this object's Id, to conform to the Model interface.
func (tag *Tag) GetId() int64 {
	return tag.Id
}

// SetId() sets this object's Id.
func (tag *Tag) SetId(id int64) {
	tag.Id = id
}

// TableName returns the name of the database table where this model's
// records are stored.
func (tag *Tag) TableName() string {
	return "tags"
}

// Validate runs validation checks on the object and returns true if
// the object is valid. If this returns false, check Errors().
func (tag *Tag) Validate() bool {
	tag.initErrors(true)
	return true
}

// Errors returns a list of errors that occurred after a call to Validate()
// or Save().
func (tag *Tag) Errors() []string {
	tag.initErrors(false)
	return tag.errors
}

// initErrors initializes the errors list. If param clearExistingList
// is true, it replaces the existing errors list with a blank list.
func (tag *Tag) initErrors(clearExistingList bool) {
	if tag.errors == nil || clearExistingList {
		tag.errors = make([]string, 0)
	}
}

// AddError adds an error message to the errors list.
func (tag *Tag) AddError(message string) {
	tag.errors = append(tag.errors, message)
}
