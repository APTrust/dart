package handlers

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"github.com/APTrust/go-form-it"
	"github.com/gorilla/mux"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	_ "github.com/mattn/go-sqlite3"
	"log"
	"net/http"
	"net/url"
	"strconv"
)

func AppSettingsList(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	settings := make([]models.AppSetting, 0)
	db.Find(&settings)
	data["items"] = settings
	successMessage, ok := r.URL.Query()["success"]
	if ok {
		data["success"] = successMessage[0]
	}
	err := templates.ExecuteTemplate(w, "app-settings-list", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func AppSettingNewGet(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	setting := models.AppSetting{}
	form := forms.BootstrapFormFromModel(setting, forms.POST, "/app_setting/new")
	data["form"] = form
	err := templates.ExecuteTemplate(w, "app-setting-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func AppSettingNewPost(w http.ResponseWriter, r *http.Request) {
	err := r.ParseForm()
	if err != nil {
		log.Println("Error:", err.Error())
	}
	setting := &models.AppSetting{}
	err = decoder.Decode(setting, r.PostForm)
	if err != nil {
		log.Println("Error:", err.Error())
	}
	data := make(map[string]interface{})
	err = db.Create(&setting).Error
	postUrl := fmt.Sprintf("/app_setting/new")
	if err != nil {
		data["errors"] = err.Error()
		postUrl = fmt.Sprintf("/app_setting/%d/edit", setting.ID)
	} else {
		msg := fmt.Sprintf("Setting '%s' has been saved", setting.Name)
		http.Redirect(w, r, "/app_settings?success="+url.QueryEscape(msg), 303)
		return
	}
	data["form"] = forms.BootstrapFormFromModel(*setting, forms.POST, postUrl)
	err = templates.ExecuteTemplate(w, "app-setting-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func AppSettingEditGet(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"])
	log.Println("GET App Setting", id)
	setting := models.AppSetting{}
	err := db.Find(&setting, uint(id)).Error
	if err != nil {
		log.Println(err.Error())
	}
	postUrl := fmt.Sprintf("/app_setting/%d/edit", id)
	data := make(map[string]interface{})
	form := forms.BootstrapFormFromModel(setting, forms.POST, postUrl)
	data["form"] = form
	err = templates.ExecuteTemplate(w, "app-setting-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func AppSettingEditPost(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"])
	log.Println("POST App Setting", id)
	err := r.ParseForm()
	if err != nil {
		log.Println("Error:", err.Error())
	}
	setting := &models.AppSetting{}
	err = decoder.Decode(setting, r.PostForm)
	if err != nil {
		log.Println("Error:", err.Error())
	}
	setting.ID = uint(id)
	data := make(map[string]interface{})
	err = db.Save(&setting).Error
	if err != nil {
		data["errors"] = err.Error()
	} else {
		msg := fmt.Sprintf("Application Setting '%s' has been saved", setting.Name)
		http.Redirect(w, r, "/app_settings?success="+url.QueryEscape(msg), 303)
		return
	}
	postUrl := fmt.Sprintf("/app_setting/%d/edit", id)
	data["form"] = forms.BootstrapFormFromModel(*setting, forms.POST, postUrl)
	err = templates.ExecuteTemplate(w, "app-setting-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}
