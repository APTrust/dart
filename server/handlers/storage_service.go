package handlers

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	_ "github.com/mattn/go-sqlite3"
	"net/http"
	"net/url"
)

func StorageServicesList(env *Environment, w http.ResponseWriter, r *http.Request) error {
	data := make(map[string]interface{})
	services := make([]models.StorageService, 0)
	env.DB.Find(&services)
	data["items"] = services
	successMessage, ok := r.URL.Query()["success"]
	if ok {
		data["success"] = successMessage[0]
	}
	return env.ExecTemplate(w, "storage-service-list", data)
}

func StorageServiceGetForm(env *Environment, w http.ResponseWriter, r *http.Request) error {
	data := make(map[string]interface{})
	service, err := ParseStorageServiceRequest(env, http.MethodGet, r)
	if err != nil {
		return WrapErr(err)
	}
	form := service.Form()
	data["form"] = form
	data["obj"] = service
	return env.ExecTemplate(w, "storage-service-form", data)
}

func StorageServicePostForm(env *Environment, w http.ResponseWriter, r *http.Request) error {
	data := make(map[string]interface{})
	service, err := ParseStorageServiceRequest(env, http.MethodPost, r)
	if err != nil {
		return WrapErr(err)
	}
	if service.IsValid() {
		if service.ID == 0 {
			err = env.DB.Create(&service).Error
		} else {
			err = env.DB.Save(&service).Error
		}
		if err != nil {
			return WrapErr(err)
		} else {
			msg := fmt.Sprintf("Storage service '%s' has been saved", service.Name)
			http.Redirect(w, r, "/storage_services?success="+url.QueryEscape(msg), 303)
			return nil
		}
	}
	// Submitted data was not valid. Show the form with errors.
	form := service.Form()
	data["form"] = form
	data["obj"] = service
	return env.ExecTemplate(w, "storage-service-form", data)
}

func ParseStorageServiceRequest(env *Environment, method string, r *http.Request) (*models.StorageService, error) {
	id, formValues, err := ParseRequest(r)
	if err != nil {
		return nil, err
	}
	return models.StorageServiceFromRequest(env.DB, method, id, formValues)
}
