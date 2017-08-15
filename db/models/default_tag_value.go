package models

import (
	"time"
)

// DefaultTagValue holds information about a tag value that is common to
// all bags.
type DefaultTagValue struct {
	Id        int       `db:"id" form_options:"skip"`
	ProfileId *int      `db:"profile_id" form_widget:"hidden"`
	TagFile   string    `db:"tag_file"`
	TagName   string    `db:"tag_name"`
	TagValue  string    `db:"tag_value"`
	UpdatedAt time.Time `db:"updated_at" form_widget:"static"`
}

// PrimaryKey() returns this object's Id, to conform to the Model interface.
func (value *DefaultTagValue) PrimaryKey() int {
	return value.Id
}

func (value *DefaultTagValue) Validate() (bool, []error) {
	return true, nil
}

func (value *DefaultTagValue) Save(validate bool) (*DefaultTagValue, error) {
	// Validate
	db := GetConnection(DEFAULT)
	tx, err := db.Beginx()
	if err != nil {
		return nil, err
	}
	//tx.NamedExec(statement, bag)
	tx.Commit()

	return value, nil
}
