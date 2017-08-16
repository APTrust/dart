package models

import ()

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

// TableName returns the name of the database table where this model's
// records are stored.
func (tag *Tag) TableName() string {
	return "tags"
}

func (tag *Tag) Validate() (bool, []error) {
	return true, nil
}

func (tag *Tag) Save(validate bool) (*Tag, error) {
	// Validate
	db := GetConnection(DEFAULT)
	tx, err := db.Beginx()
	if err != nil {
		return nil, err
	}
	//tx.NamedExec(statement, bag)
	tx.Commit()

	return tag, nil
}
