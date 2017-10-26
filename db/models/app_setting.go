package models

import (
	"fmt"
	"github.com/gorilla/mux"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"net/http"
	"strconv"
	"strings"
)

type AppSetting struct {
	gorm.Model `form_options:"skip"`
	Name       string
	Value      string
	Errors     map[string]string `sql:"-",form_options:"skip"`
}

// NewAppSetting returns a new AppSetting with the specified name and value.
func NewAppSetting(name, value string) *AppSetting {
	return &AppSetting{
		Name:   name,
		Value:  value,
		Errors: make(map[string]string),
	}
}

// IsValid returns true or false to indicate whether the current model is valid.
// If this returns false, check the settings.Errors map for specific errors.
func (setting *AppSetting) IsValid() bool {
	isValid := true
	setting.Errors = make(map[string]string)
	if strings.TrimSpace(setting.Name) == "" {
		isValid = false
		setting.Errors["Name"] = "Name is required."
	}
	return isValid
}

// Form returns a Form for this AppSetting, suitable for rendering in an HTML template.
func (setting *AppSetting) Form() *Form {
	action := "/app_setting/new"
	method := "post"
	if setting.ID != 0 {
		action = fmt.Sprintf("/app_setting/%d/edit", setting.ID)
	}
	form := NewForm(action, method)
	form.Fields["Name"] = NewField("name", "name", setting.Name)
	// This works, but we need to fix the behavior on the front end.
	// form.Fields["Name"].Attrs["required"] = "true"
	form.Fields["Value"] = NewField("value", "value", setting.Value)
	return form
}

// AppSettingFromRequest returns an AppSetting from the HTTP request.
func AppSettingFromRequest(db *gorm.DB, r *http.Request) (*AppSetting, error) {
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"]) // err OK - we expect zeros for new items
	if r.Method == "GET" && id != 0 {
		setting := NewAppSetting("", "")
		err := db.Find(&setting, uint(id)).Error
		return setting, err
	}
	err := r.ParseForm()
	if err != nil {
		return nil, err
	}
	appSetting := NewAppSetting(r.FormValue("name"), r.FormValue("value"))
	appSetting.ID = uint(id)
	return appSetting, nil
}
