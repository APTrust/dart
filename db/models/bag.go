package models

import (
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
	if err == nil {
		return bag, err
	}
	return nil, err
}

// GetBags returns the bags matching the criteria specified in where.
// The values param should be a map of values reference in the
// where clause.
//
// For example:
//
// where := "name = ? and age = ?"
// values := []interface{} { "Billy Bob Thornton", 62 }
// bags, err := GetBags(where, values)
func GetBags(where string, values []interface{}) ([]*Bag, error) {
	bag := &Bag{}
	var query string
	if strings.TrimSpace(where) != "" {
		query = SelectWhere(bag, where)
	} else {
		query = SelectQuery(bag)
	}
	bags := make([]*Bag, 0)
	db := GetConnection(DEFAULT_CONNECTION)
	err := db.Select(&bags, query, values...)
	return bags, err
}

// Save saves the object to the database. If validate is true,
// it validates before saving. After a successful save, the object
// will have a non-zero Id. If this returns false, check Errors().
func (bag *Bag) Save(validate bool) bool {
	return SaveObject(bag)
}

// GetId() returns this object's Id, to conform to the Model interface.
func (bag *Bag) GetId() int64 {
	return bag.Id
}

// SetId() sets this object's Id.
func (bag *Bag) SetId(id int64) {
	bag.Id = id
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

// AddError adds an error message to the errors list.
func (bag *Bag) AddError(message string) {
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
