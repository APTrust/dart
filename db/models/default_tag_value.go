package models

import (
	"github.com/jmoiron/sqlx"
	"time"
)

// DefaultTagValue holds information about a tag value that is common to
// all bags.
type DefaultTagValue struct {
	Id        int       `db:"id"`
	ProfileId *int      `db:"profile_id"`
	TagFile   string    `db:"tag_file"`
	TagName   string    `db:"tag_name"`
	TagValue  string    `db:"tag_value"`
	UpdatedAt time.Time `db:"updated_at"`
}

// PrimaryKey() returns this object's Id, to conform to the Model interface.
func (value *DefaultTagValue) PrimaryKey() int {
	return value.Id
}

func (value *DefaultTagValue) Validate() (bool, []error) {
	return true, nil
}

func (value *DefaultTagValue) Save(db *sqlx.DB) (*DefaultTagValue, error) {
	// Insert if Id is zero, otherwise update.
	// Return value with Id.
	return value, nil
}
