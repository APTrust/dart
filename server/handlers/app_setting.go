package handlers

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"github.com/APTrust/go-form-it"
	"github.com/gorilla/mux"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	_ "github.com/mattn/go-sqlite3"
	"net/http"
	"net/url"
	"strconv"
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

func AppSettingNewGet(env *Environment, w http.ResponseWriter, r *http.Request) error {
	data := make(map[string]interface{})
	setting, err := models.AppSettingFromRequest(r)
	if err != nil {
		return WrapErr(err)
	}
	form := setting.Form()
	data["form"] = form
	data["obj"] = setting
	return env.ExecTemplate(w, "app-setting-form", data)
}

func AppSettingNewPost(env *Environment, w http.ResponseWriter, r *http.Request) error {
	err := r.ParseForm()
	if err != nil {
		return WrapErr(err)
	}
	setting := &models.AppSetting{}
	err = env.Decoder.Decode(setting, r.PostForm)
	if err != nil {
		return WrapErr(err)
	}
	data := make(map[string]interface{})
	err = env.DB.Create(&setting).Error
	postUrl := fmt.Sprintf("/app_setting/new")
	if err != nil {
		data["errors"] = err.Error()
		postUrl = fmt.Sprintf("/app_setting/%d/edit", setting.ID)
	} else {
		msg := fmt.Sprintf("Setting '%s' has been saved", setting.Name)
		http.Redirect(w, r, "/app_settings?success="+url.QueryEscape(msg), 303)
		return nil
	}
	data["form"] = forms.BootstrapFormFromModel(*setting, forms.POST, postUrl)
	return env.ExecTemplate(w, "app-setting-form", data)
}

func AppSettingEditGet(env *Environment, w http.ResponseWriter, r *http.Request) error {
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"])
	setting := models.AppSetting{}
	err := env.DB.Find(&setting, uint(id)).Error
	if err != nil {
		return WrapErr(err)
	}
	postUrl := fmt.Sprintf("/app_setting/%d/edit", id)
	data := make(map[string]interface{})
	form := forms.BootstrapFormFromModel(setting, forms.POST, postUrl)
	data["form"] = form
	return env.ExecTemplate(w, "app-setting-form", data)
}

func AppSettingEditPost(env *Environment, w http.ResponseWriter, r *http.Request) error {
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"])
	err := r.ParseForm()
	if err != nil {
		return WrapErr(err)
	}
	setting := &models.AppSetting{}
	err = env.Decoder.Decode(setting, r.PostForm)
	if err != nil {
		return WrapErr(err)
	}
	setting.ID = uint(id)
	data := make(map[string]interface{})
	err = env.DB.Save(&setting).Error
	if err != nil {
		data["errors"] = err.Error()
	} else {
		msg := fmt.Sprintf("Application Setting '%s' has been saved", setting.Name)
		http.Redirect(w, r, "/app_settings?success="+url.QueryEscape(msg), 303)
		return nil
	}
	postUrl := fmt.Sprintf("/app_setting/%d/edit", id)
	data["form"] = forms.BootstrapFormFromModel(*setting, forms.POST, postUrl)
	return env.ExecTemplate(w, "app-setting-form", data)
}
