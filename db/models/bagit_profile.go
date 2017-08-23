package models

import (
	"encoding/json"
	"github.com/APTrust/easy-store/bagit"
	"strings"
)

// *** See types.JSONText for parsedProfile bagit.BagItProfile ***

// BagItProfile contains a BagIt profile that tells us how to construct
// and validate a bag.
type BagItProfile struct {
	Id            int64               `db:"id" form_options:"skip"`
	Name          string              `db:"name"`
	Description   string              `db:"description" form_widget:"textarea"`
	JSON          string              `db:"json" form_widget:"textarea"`
	parsedProfile *bagit.BagItProfile `form_options:"skip"`
	errors        []string            `form_options:"skip"`
}

// GetBagItProfile returns the profile with the specified id,
// or an error if the profile does not exist.
func GetBagItProfile(id int64) (*BagItProfile, error) {
	profile := &BagItProfile{Id: id}
	query := SelectByIdQuery(profile)
	db := GetConnection(DEFAULT_CONNECTION)
	err := db.Get(profile, query, id)
	return profile, err
}

// GetBagItProfiles returns the profiles matching the criteria specified in where.
// The values param should be a map of values reference in the
// where clause.
//
// For example:
//
// where := "name = ? and age = ?"
// values := []interface{} { "Billy Bob Thornton", 62 }
// profiles, err := GetBagItProfiles(where, values)
func GetBagItProfiles(where string, values []interface{}) ([]*BagItProfile, error) {
	profile := &BagItProfile{}
	var query string
	if strings.TrimSpace(where) != "" {
		query = SelectWhere(profile, where)
	} else {
		query = SelectQuery(profile)
	}
	profiles := make([]*BagItProfile, 0)
	db := GetConnection(DEFAULT_CONNECTION)
	err := db.Select(&profiles, query, values...)
	return profiles, err
}

// Save saves the object to the database. If validate is true,
// it validates before saving. After a successful save, the object
// will have a non-zero Id. If this returns false, check Errors().
func (profile *BagItProfile) Save(validate bool) bool {
	return SaveObject(profile)
}

// GetId() returns this object's Id, to conform to the Model interface.
func (profile *BagItProfile) GetId() int64 {
	return profile.Id
}

// SetId() sets this object's Id.
func (profile *BagItProfile) SetId(id int64) {
	profile.Id = id
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

// AddError adds an error message to the errors list.
func (profile *BagItProfile) AddError(message string) {
	profile.errors = append(profile.errors, message)
}

func (profile *BagItProfile) Profile() (*bagit.BagItProfile, error) {
	bagItProfile := &bagit.BagItProfile{}
	err := json.Unmarshal([]byte(profile.JSON), bagItProfile)
	return bagItProfile, err
}
