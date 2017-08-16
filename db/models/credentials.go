package models

import ()

// Credentials holds information about credentials needed to connect
// to remote storage services, REST APIs, etc.
type Credentials struct {
	Id          int    `db:"id" form_options:"skip"`
	Name        string `db:"name"`
	Description string `db:"description"`
	Key         string `db:"key"`
	Value       string `db:"value"`
}

// PrimaryKey() returns this object's Id, to conform to the Model interface.
func (credentials *Credentials) PrimaryKey() int {
	return credentials.Id
}

// TableName returns the name of the database table where this model's
// records are stored.
func (credentials *Credentials) TableName() string {
	return "credentials"
}

func (credentials *Credentials) Validate() (bool, []error) {
	return true, nil
}

func (credentials *Credentials) Save(validate bool) (*Credentials, error) {
	// Validate
	db := GetConnection(DEFAULT)
	tx, err := db.Beginx()
	if err != nil {
		return nil, err
	}
	//tx.NamedExec(statement, bag)
	tx.Commit()

	return credentials, nil
}
