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
}

// PrimaryKey() returns this object's Id, to conform to the Model interface.
func (profile *BagItProfile) PrimaryKey() int {
	return profile.Id
}

func (profile *BagItProfile) Validate() (bool, []error) {
	return true, nil
}

func (profile *BagItProfile) Save(validate bool) (*BagItProfile, error) {
	// 	db := GetConnection(DEFAULT)
	return profile, nil
}

func (profile *BagItProfile) Profile() (*bagit.BagItProfile, error) {
	// Return the parsed json profile.
	return nil, nil
}
