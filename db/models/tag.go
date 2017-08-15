package models

import (
	"github.com/jmoiron/sqlx"
)

// Tag holds information about a tag in bag built by easy-store.
// A cat in the hat from the hooka store.
type Tag struct {
	Id    int    `db:"id" form_options:"skip"`
	BagId *int   `db:"bag_id" form_widget:"hidden"`
	Name  string `db:"name"`
	Value string `db:"value"`
}

// PrimaryKey() returns this object's Id, to conform to the Model interface.
func (tag *Tag) PrimaryKey() int {
	return tag.Id
}

func (tag *Tag) Validate() (bool, []error) {
	return true, nil
}

func (tag *Tag) Save(db *sqlx.DB) (*Tag, error) {
	// Insert if Id is zero, otherwise update.
	// Return tag with Id.
	return tag, nil
}
