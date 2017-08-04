package models

import (
	"github.com/APTrust/easy-store/bagit"
	"github.com/jmoiron/sqlx"
)

// BagItProfile holds information about how to connect to a remote
// storage service.
type BagItProfile struct {
	Id             int    `db:"id"`
	Name           string `db:"name"`
	Description    string `db:"description"`
	Protocol       string `db:"protocol"`
	BucketOrFolder string `db:"bucket_or_folder"`
	CredentialsId  *int   `db:"credentials_id"`
	parsedProfile  *bagit.BagItProfile
}

func NewBagItProfileFromRow() (*BagItProfile, error) {
	return nil, nil
}

func NewBagItProfileFromMap() (*BagItProfile, error) {
	return nil, nil
}

func (setting *BagItProfile) Validate() (bool, []error) {
	return true, nil
}

func (setting *BagItProfile) Save(db *sqlx.DB) (*BagItProfile, error) {
	// Insert if Id is zero, otherwise update.
	// Return setting with Id.
	return setting, nil
}

func (setting *BagItProfile) Profile() (*bagit.BagItProfile, error) {
	// Return the parsed json profile.
	return nil, nil
}
