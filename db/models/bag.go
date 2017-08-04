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

func NewBagFromRow() (*Bag, error) {
	return nil, nil
}

func NewBagFromMap() (*Bag, error) {
	return nil, nil
}

func (bag *Bag) Validate() (bool, []error) {
	return true, nil
}

func (bag *Bag) Save(db *sqlx.DB) (*Bag, error) {
	// Insert if Id is zero, otherwise update.
	// Return item with Id.
	return bag, nil
}

func (bag *Bag) Files(db *sqlx.DB) (*[]File, error) {
	// Return files belonging to this bag
	return nil, nil
}
