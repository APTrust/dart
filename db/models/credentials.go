package models

import (
	"github.com/jmoiron/sqlx"
)

// Credentials holds information about credentials needed to connect
// to remote storage services, REST APIs, etc.
type Credentials struct {
	Id          int    `db:"id"`
	Name        string `db:"name"`
	Description string `db:"description"`
	Key         string `db:"key"`
	Value       string `db:"value"`
}

func NewCredentialsFromRow() (*Credentials, error) {
	return nil, nil
}

func NewCredentialsFromMap() (*Credentials, error) {
	return nil, nil
}

func (setting *Credentials) Validate() (bool, []error) {
	return true, nil
}

func (setting *Credentials) Save(db *sqlx.DB) (*Credentials, error) {
	// Insert if Id is zero, otherwise update.
	// Return setting with Id.
	return setting, nil
}
