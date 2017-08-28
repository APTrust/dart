package models

import (
	"strings"
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

// GetFile returns the file with the specified id, or an error if the
// file does not exist.
func GetFile(id int64) (*File, error) {
	file := &File{Id: id}
	query := SelectByIdQuery(file)
	db := GetConnection(DEFAULT_CONNECTION)
	err := db.Get(file, query, id)
	if err == nil {
		return file, err
	}
	return nil, err
}

// GetFiles returns the files matching the criteria specified in where.
// The values param should be a map of values reference in the
// where clause.
//
// For example:
//
// where := "name = ? and age = ?"
// values := []interface{} { "Billy Bob Thornton", 62 }
// files, err := GetFiles(where, values)
func GetFiles(where string, values []interface{}) ([]*File, error) {
	file := &File{}
	var query string
	if strings.TrimSpace(where) != "" {
		query = SelectWhere(file, where)
	} else {
		query = SelectQuery(file)
	}
	files := make([]*File, 0)
	db := GetConnection(DEFAULT_CONNECTION)
	err := db.Select(&files, query, values...)
	return files, err
}

// Save saves the object to the database. If validate is true,
// it validates before saving. After a successful save, the object
// will have a non-zero Id. If this returns false, check Errors().
func (file *File) Save(validate bool) bool {
	return SaveObject(file)
}

// GetId() returns this object's Id, to conform to the Model interface.
func (file *File) GetId() int64 {
	return file.Id
}

// SetId() sets this object's Id.
func (file *File) SetId(id int64) {
	file.Id = id
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

// AddError adds an error message to the errors list.
func (file *File) AddError(message string) {
	file.errors = append(file.errors, message)
}
