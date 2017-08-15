package models

import (
	"time"
)

// Bag holds information about a bag built by easy-store.
type Bag struct {
	Id                        int       `db:"id" form_options:"skip"`
	Name                      string    `db:"name"`
	Size                      int64     `db:"size" form_options:"skip"`
	StorageURL                string    `db:"storage_url" form_options:"skip"`
	MetadataURL               string    `db:"metadata_url" form_options:"skip"`
	StorageRegistryIdentifier string    `db:"storage_registry_identifier" form_options:"skip"`
	StoredAt                  time.Time `db:"stored_at" form_options:"skip"`
	CreatedAt                 time.Time `db:"created_at" form_options:"skip"`
	UpdatedAt                 time.Time `db:"updated_at" form_options:"skip"`
}

// PrimaryKey() returns this object's Id, to conform to the Model interface.
func (bag *Bag) PrimaryKey() int {
	return bag.Id
}

func (bag *Bag) Validate() (bool, []error) {
	return true, nil
}

func (bag *Bag) Save(validate bool) (*Bag, error) {
	// Insert if Id is zero, otherwise update.
	// Return item with Id.
	db := GetConnection(DEFAULT)

	// Validate

	tx, err := db.Beginx()
	if err != nil {
		return nil, err
	}
	//tx.NamedExec(statement, bag)
	tx.Commit()
	return bag, nil
}

func (bag *Bag) Files() (*[]File, error) {
	// Return files belonging to this bag
	db := GetConnection(DEFAULT)
	tx, err := db.Beginx()
	if err != nil {
		return nil, err
	}
	//tx.NamedExec(statement, bag)
	tx.Commit()
	return nil, nil
}
