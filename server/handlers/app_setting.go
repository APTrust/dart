package handlers

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	_ "github.com/mattn/go-sqlite3"
	"net/http"
	"net/url"
)

func AppSettingsList(env *Environment, w http.ResponseWriter, r *http.Request) error {
	data := make(map[string]interface{})
	settings := make([]models.AppSetting, 0)
	env.DB.Find(&settings)
	data["items"] = settings
	successMessage, ok := r.URL.Query()["success"]
	if ok {
		data["success"] = successMessage[0]
	}
	return env.ExecTemplate(w, "app-settings-list", data)
}

func AppSettingGetForm(env *Environment, w http.ResponseWriter, r *http.Request) error {
	data := make(map[string]interface{})
	setting, err := ParseSettingRequest(env, http.MethodGet, r)
	if err != nil {
		return WrapErr(err)
	}
	form := setting.Form()
	data["form"] = form
	data["obj"] = setting
	return env.ExecTemplate(w, "app-setting-form", data)
}

func AppSettingPostForm(env *Environment, w http.ResponseWriter, r *http.Request) error {
	data := make(map[string]interface{})
	setting, err := ParseSettingRequest(env, http.MethodPost, r)
	if err != nil {
		return WrapErr(err)
	}
	if setting.IsValid() {
		if setting.ID == 0 {
			err = env.DB.Create(&setting).Error
		} else {
			err = env.DB.Save(&setting).Error
		}
		if err != nil {
			return WrapErr(err)
		} else {
			msg := fmt.Sprintf("Setting '%s' has been saved", setting.Name)
			http.Redirect(w, r, "/app_settings?success="+url.QueryEscape(msg), 303)
			return nil
		}
	}
	// Submitted data was not valid. Show the form with errors.
	form := setting.Form()
	data["form"] = form
	data["obj"] = setting
	return env.ExecTemplate(w, "app-setting-form", data)
}

func ParseSettingRequest(env *Environment, method string, r *http.Request) (*models.AppSetting, error) {
	id, formValues, err := ParseRequest(r)
	if err != nil {
		return nil, err
	}
	return models.AppSettingFromRequest(env.DB, method, id, formValues)
}
