package models

import (
	"time"
)

// File holds information about a file that easy-store has
// either bagged or uploaded.
type File struct {
	Id                int64     `db:"id" form_options:"skip"`
	BagId             *int      `db:"bag_id"`
	Name              string    `db:"name"`
	Size              int64     `db:"size"`
	Md5               string    `db:"md5"`
	Sha256            string    `db:"sha256"`
	StorageURL        string    `db:"storage_url"`
	StoredAsPartOfBag bool      `db:"stored_as_part_of_bag"`
	ETag              string    `db:"etag"`
	StoredAt          time.Time `db:"stored_at"`
	CreatedAt         time.Time `db:"created_at"`
	UpdatedAt         time.Time `db:"updated_at"`
	errors            []string
}

// PrimaryKey() returns this object's Id, to conform to the Model interface.
func (file *File) PrimaryKey() int64 {
	return file.Id
}

// TableName returns the name of the database table where this model's
// records are stored.
func (file *File) TableName() string {
	return "files"
}

// Validate runs validation checks on the object and returns true if
// the object is valid. If this returns false, check Errors().
func (file *File) Validate() bool {
	file.initErrors(true)
	return true
}

// Save saves the object to the database. If validate is true,
// it validates before saving. After a successful save, the object
// will have a non-zero Id. If this returns false, check Errors().
func (file *File) Save(validate bool) bool {
	if !file.Validate() {
		return false
	}
	db := GetConnection(DEFAULT_CONNECTION)
	tx, err := db.Beginx()
	if err != nil {
		file.addError(err.Error())
		return false
	}
	//tx.NamedExec(statement, file)
	tx.Commit()
	return true
}

// Errors returns a list of errors that occurred after a call to Validate()
// or Save().
func (file *File) Errors() []string {
	file.initErrors(false)
	return file.errors
}

// initErrors initializes the errors list. If param clearExistingList
// is true, it replaces the existing errors list with a blank list.
func (file *File) initErrors(clearExistingList bool) {
	if file.errors == nil || clearExistingList {
		file.errors = make([]string, 0)
	}
}

// addError adds an error message to the errors list.
func (file *File) addError(message string) {
	file.errors = append(file.errors, message)
}
