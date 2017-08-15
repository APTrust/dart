package models

import ()

// GeneralSetting holds information about a general application-wide setting,
// such as the path to the directory where bags should be built.
type GeneralSetting struct {
	Id    int    `db:"id" form_options:"skip"`
	Name  string `db:"name"`
	Value string `db:"value"`
}

// PrimaryKey() returns this object's Id, to conform to the Model interface.
func (setting *GeneralSetting) PrimaryKey() int {
	return setting.Id
}

func (setting *GeneralSetting) Validate() (bool, []error) {
	return true, nil
}

func (setting *GeneralSetting) Save(validate bool) (*GeneralSetting, error) {
	// Validate
	db := GetConnection(DEFAULT)
	tx, err := db.Beginx()
	if err != nil {
		return nil, err
	}
	//tx.NamedExec(statement, bag)
	tx.Commit()

	return setting, nil
}
