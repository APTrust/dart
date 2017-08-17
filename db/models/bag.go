package models

import (
	"log"
	"strings"
	"time"
)

// Bag holds information about a bag built by easy-store.
type Bag struct {
	Id                        int64     `db:"id" form_options:"skip"`
	Name                      string    `db:"name"`
	Size                      int64     `db:"size" form_options:"skip"`
	StorageURL                string    `db:"storage_url" form_options:"skip"`
	MetadataURL               string    `db:"metadata_url" form_options:"skip"`
	StorageRegistryIdentifier string    `db:"storage_registry_identifier" form_options:"skip"`
	StoredAt                  time.Time `db:"stored_at" form_options:"skip"`
	CreatedAt                 time.Time `db:"created_at" form_options:"skip"`
	UpdatedAt                 time.Time `db:"updated_at" form_options:"skip"`
	errors                    []string
}

// GetBag returns the bag with the specified id, or an error if the
// bag does not exist.
func GetBag(id int64) (*Bag, error) {
	bag := &Bag{Id: id}
	query := SelectByIdQuery(bag)
	db := GetConnection(DEFAULT_CONNECTION)
	err := db.Get(bag, query, id)
	return bag, err
}

// GetBags returns the bags matching the criteria specified in where.
// The values param should be a map of values reference in the
// where clause.
//
// For example:
//
// where := "name = :name and age = :age"
// values := map[string]interface{} {
//    "name": "Billy Bob Thornton",
//    "age": 62,
// }
// bags, err := GetBags(where, values)
func GetBags(where string, values map[string]interface{}) ([]*Bag, error) {
	bag := &Bag{}
	var query string
	if strings.TrimSpace(where) != "" {
		query = SelectWhere(bag, where)
	} else {
		query = SelectQuery(bag)
	}
	db := GetConnection(DEFAULT_CONNECTION)
	rows, err := db.NamedQuery(query, values)

	// DEBUG
	log.Println(query, values)

	if err != nil {
		return nil, err
	}
	bags := make([]*Bag, 0)
	for rows.Next() {
		bag = &Bag{}
		err = rows.StructScan(bag)
		if err != nil {
			return nil, err
		}
		bags = append(bags, bag)
	}
	return bags, err
}

// PrimaryKey() returns this object's Id, to conform to the Model interface.
func (bag *Bag) PrimaryKey() int64 {
	return bag.Id
}

// TableName returns the name of the database table where this model's
// records are stored.
func (bag *Bag) TableName() string {
	return "bags"
}

// Validate runs validation checks on the object and returns true if
// the object is valid. If this returns false, check Errors().
func (bag *Bag) Validate() bool {
	bag.initErrors(true)
	return true
}

// Save saves the object to the database. If validate is true,
// it validates before saving. After a successful save, the object
// will have a non-zero Id. If this returns false, check Errors().
func (bag *Bag) Save(validate bool) bool {
	if !bag.Validate() {
		return false
	}
	statement := SaveStatement(bag)

	// DEBUG
	// log.Println(statement)

	db := GetConnection(DEFAULT_CONNECTION)
	result, err := db.NamedExec(statement, bag)
	if err != nil {
		bag.addError(err.Error())
		return false
	}
	id, err := result.LastInsertId()
	if err != nil {
		bag.addError(err.Error())
		return false
	}
	bag.Id = id
	return true
}

// Errors returns a list of errors that occurred after a call to Validate()
// or Save().
func (bag *Bag) Errors() []string {
	bag.initErrors(false)
	return bag.errors
}

// initErrors initializes the errors list. If param clearExistingList
// is true, it replaces the existing errors list with a blank list.
func (bag *Bag) initErrors(clearExistingList bool) {
	if bag.errors == nil || clearExistingList {
		bag.errors = make([]string, 0)
	}
}

// addError adds an error message to the errors list.
func (bag *Bag) addError(message string) {
	bag.errors = append(bag.errors, message)
}

func (bag *Bag) Files() (*[]File, error) {
	// Return files belonging to this bag
	db := GetConnection(DEFAULT_CONNECTION)
	tx, err := db.Beginx()
	if err != nil {
		return nil, err
	}
	//tx.NamedExec(statement, bag)
	tx.Commit()
	return nil, nil
}
