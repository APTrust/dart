package models

import (
	"github.com/APTrust/easy-store/bagit"
)

// *** See types.JSONText for parsedProfile bagit.BagItProfile ***

// BagItProfile contains a BagIt profile that tells us how to construct
// and validate a bag.
type BagItProfile struct {
	Id            int    `db:"id" form_options:"skip"`
	Name          string `db:"name"`
	Description   string `db:"description" form_widget:"textarea"`
	JSON          string `db: "json" form_widget:"textarea"`
	parsedProfile *bagit.BagItProfile
	errors        []string
}

// PrimaryKey() returns this object's Id, to conform to the Model interface.
func (profile *BagItProfile) PrimaryKey() int {
	return profile.Id
}

// TableName returns the name of the database table where this model's
// records are stored.
func (profile *BagItProfile) TableName() string {
	return "bagit_profiles"
}

// Validate runs validation checks on the object and returns true if
// the object is valid. If this returns false, check Errors().
func (profile *BagItProfile) Validate() bool {
	profile.initErrors(true)
	return true
}

// Save saves the object to the database. If validate is true,
// it validates before saving. After a successful save, the object
// will have a non-zero Id. If this returns false, check Errors().
func (profile *BagItProfile) Save(validate bool) bool {
	if !profile.Validate() {
		return false
	}
	db := GetConnection(DEFAULT_CONNECTION)
	tx, err := db.Beginx()
	if err != nil {
		profile.addError(err.Error())
		return false
	}
	//tx.NamedExec(statement, profile)
	tx.Commit()
	return true
}

// Errors returns a list of errors that occurred after a call to Validate()
// or Save().
func (profile *BagItProfile) Errors() []string {
	profile.initErrors(false)
	return profile.errors
}

// initErrors initializes the errors list. If param clearExistingList
// is true, it replaces the existing errors list with a blank list.
func (profile *BagItProfile) initErrors(clearExistingList bool) {
	if profile.errors == nil || clearExistingList {
		profile.errors = make([]string, 0)
	}
}

// addError adds an error message to the errors list.
func (profile *BagItProfile) addError(message string) {
	profile.errors = append(profile.errors, message)
}

func (profile *BagItProfile) Profile() (*bagit.BagItProfile, error) {
	// Return the parsed json profile.
	return nil, nil
}
