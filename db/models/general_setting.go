package models

import ()

// GeneralSetting holds information about a general application-wide setting,
// such as the path to the directory where bags should be built.
type GeneralSetting struct {
	Id     int    `db:"id" form_options:"skip"`
	Name   string `db:"name"`
	Value  string `db:"value"`
	errors []string
}

// PrimaryKey() returns this object's Id, to conform to the Model interface.
func (setting *GeneralSetting) PrimaryKey() int {
	return setting.Id
}

// TableName returns the name of the database table where this model's
// records are stored.
func (setting *GeneralSetting) TableName() string {
	return "general_settings"
}

// Validate runs validation checks on the object and returns true if
// the object is valid. If this returns false, check Errors().
func (setting *GeneralSetting) Validate() bool {
	setting.initErrors(true)
	return true
}

// Save saves the object to the database. If validate is true,
// it validates before saving. After a successful save, the object
// will have a non-zero Id. If this returns false, check Errors().
func (setting *GeneralSetting) Save(validate bool) bool {
	if !setting.Validate() {
		return false
	}
	db := GetConnection(DEFAULT_CONNECTION)
	tx, err := db.Beginx()
	if err != nil {
		setting.addError(err.Error())
		return false
	}
	//tx.NamedExec(statement, setting)
	tx.Commit()
	return true
}

// Errors returns a list of errors that occurred after a call to Validate()
// or Save().
func (setting *GeneralSetting) Errors() []string {
	setting.initErrors(false)
	return setting.errors
}

// initErrors initializes the errors list. If param clearExistingList
// is true, it replaces the existing errors list with a blank list.
func (setting *GeneralSetting) initErrors(clearExistingList bool) {
	if setting.errors == nil || clearExistingList {
		setting.errors = make([]string, 0)
	}
}

// addError adds an error message to the errors list.
func (setting *GeneralSetting) addError(message string) {
	setting.errors = append(setting.errors, message)
}
