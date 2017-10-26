package models

import (
	"fmt"
	"github.com/gorilla/mux"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"net/http"
	"strconv"
)

type AppSetting struct {
	gorm.Model `form_options:"skip"`
	Name       string
	Value      string
}

func NewAppSetting(name, value string) *AppSetting {
	return &AppSetting{
		Name:  name,
		Value: value,
	}
}

// Form returns a Form for this AppSetting, suitable for rendering in an HTML template.
func (setting *AppSetting) Form() *Form {
	action := "/app_setting/new"
	method := "post"
	if setting.ID != 0 {
		action = fmt.Sprintf("/app_setting/%d/edit", setting.ID)
	}
	form := NewForm(action, method)
	form.Fields["Name"] = NewField("name", "name", setting.Name, nil)
	form.Fields["Value"] = NewField("value", "value", setting.Value, nil)
	return form
}

// AppSettingFromRequest returns an AppSetting from the HTTP request.
func AppSettingFromRequest(r *http.Request) (*AppSetting, error) {
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"]) // err OK - we expect zeros for new items
	err := r.ParseForm()
	if err != nil {
		return nil, err
	}
	appSetting := NewAppSetting(r.FormValue("name"), r.FormValue("value"))
	appSetting.ID = uint(id)
	return appSetting, nil
}
