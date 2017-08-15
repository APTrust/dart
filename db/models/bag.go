package models

import (
	"github.com/jmoiron/sqlx"
	"time"
)

// Bag holds information about a bag built by easy-store.
type Bag struct {
	Id                        int       `db:"id"`
	Name                      string    `db:"name"`
	Size                      int64     `db:"size"`
	StorageURL                string    `db:"storage_url"`
	MetadataURL               string    `db:"metadata_url"`
	StorageRegistryIdentifier string    `db:"storage_registry_identifier"`
	StoredAt                  time.Time `db:"stored_at"`
	CreatedAt                 time.Time `db:"created_at"`
	UpdatedAt                 time.Time `db:"updated_at"`
}

func BagGetById(db *sqlx.DB, id int) (*Bag, error) {
	bag := Bag{}
	err := db.Get(&bag, "select * from bags where id=$1", id)
	return &bag, err
}

func NewBagFromMap() (*Bag, error) {
	return nil, nil
}

// PrimaryKey() returns this object's Id, to conform to the Model interface.
func (bag *Bag) PrimaryKey() int {
	return bag.Id
}

func (bag *Bag) Validate() (bool, []error) {
	return true, nil
}

func (bag *Bag) Save(db *sqlx.DB) (*Bag, error) {
	// Insert if Id is zero, otherwise update.
	// Return item with Id.

	tx, err := db.Beginx()
	if err != nil {
		return nil, err
	}
	//tx.NamedExec(statement, bag)
	tx.Commit()
	return bag, nil
}

func (bag *Bag) Files(db *sqlx.DB) (*[]File, error) {
	// Return files belonging to this bag
	return nil, nil
}
