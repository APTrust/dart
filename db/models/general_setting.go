package models

import (
	"github.com/jmoiron/sqlx"
)

// GeneralSetting holds information about a general application-wide setting,
// such as the path to the directory where bags should be built.
type GeneralSetting struct {
	Id    int    `db:"id"`
	Name  string `db:"name"`
	Value string `db:"value"`
}

func NewGeneralSettingFromRow() (*GeneralSetting, error) {
	return nil, nil
}

func NewGeneralSettingFromMap() (*GeneralSetting, error) {
	return nil, nil
}

func (setting *GeneralSetting) Validate() (bool, []error) {
	return true, nil
}

func (setting *GeneralSetting) Save(db *sqlx.DB) (*GeneralSetting, error) {
	// Insert if Id is zero, otherwise update.
	// Return setting with Id.
	return setting, nil
}
