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

func NewDefaultTagValueFromRow() (*DefaultTagValue, error) {
	return nil, nil
}

func NewDefaultTagValueFromMap() (*DefaultTagValue, error) {
	return nil, nil
}

func (setting *DefaultTagValue) Validate() (bool, []error) {
	return true, nil
}

func (setting *DefaultTagValue) Save(db *sqlx.DB) (*DefaultTagValue, error) {
	// Insert if Id is zero, otherwise update.
	// Return setting with Id.
	return setting, nil
}
