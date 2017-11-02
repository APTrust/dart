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

// func StorageServiceNewGet(env *Environment, w http.ResponseWriter, r *http.Request) error {
// 	data := make(map[string]interface{})
// 	service := models.StorageService{}
// 	form := forms.BootstrapFormFromModel(service, forms.POST, "/storage_service/new")
// 	//	form.Field("Protocol").SetSelectChoices(models.TransferProtocolOptions())
// 	data["form"] = form
// 	return env.ExecTemplate(w, "storage-service-form", data)
// }

// func StorageServiceNewPost(env *Environment, w http.ResponseWriter, r *http.Request) error {
// 	err := r.ParseForm()
// 	if err != nil {
// 		return errors.WithStack(err)
// 	}
// 	service := &models.StorageService{}
// 	err = env.Decoder.Decode(service, r.PostForm)
// 	if err != nil {
// 		return errors.WithStack(err)
// 	}
// 	data := make(map[string]interface{})
// 	err = env.DB.Create(&service).Error
// 	postUrl := fmt.Sprintf("/storage_service/new")
// 	if err != nil {
// 		data["errors"] = err.Error()
// 		postUrl = fmt.Sprintf("/storage_service/%d/edit", service.ID)
// 	} else {
// 		msg := fmt.Sprintf("Storage Service '%s' has been saved", service.Name)
// 		http.Redirect(w, r, "/storage_services?success="+url.QueryEscape(msg), 303)
// 		return nil
// 	}
// 	data["form"] = forms.BootstrapFormFromModel(*service, forms.POST, postUrl)
// 	return env.ExecTemplate(w, "storage-service-form", data)
// }

// func StorageServiceEditGet(env *Environment, w http.ResponseWriter, r *http.Request) error {
// 	vars := mux.Vars(r)
// 	id, _ := strconv.Atoi(vars["id"])
// 	service := models.StorageService{}
// 	err := env.DB.Find(&service, uint(id)).Error
// 	if err != nil {
// 		return errors.WithStack(err)
// 	}
// 	postUrl := fmt.Sprintf("/storage_service/%d/edit", id)
// 	data := make(map[string]interface{})
// 	form := forms.BootstrapFormFromModel(service, forms.POST, postUrl)
// 	//	form.Field("Protocol").SetSelectChoices(models.TransferProtocolOptions())
// 	form.Field("Protocol").SetValue(service.Protocol)
// 	data["form"] = form
// 	return env.ExecTemplate(w, "storage-service-form", data)
// }

// func StorageServiceEditPost(env *Environment, w http.ResponseWriter, r *http.Request) error {
// 	vars := mux.Vars(r)
// 	id, _ := strconv.Atoi(vars["id"])
// 	err := r.ParseForm()
// 	if err != nil {
// 		return errors.WithStack(err)
// 	}
// 	service := &models.StorageService{}
// 	err = env.Decoder.Decode(service, r.PostForm)
// 	if err != nil {
// 		return errors.WithStack(err)
// 	}
// 	service.ID = uint(id)
// 	data := make(map[string]interface{})
// 	err = env.DB.Save(&service).Error
// 	if err != nil {
// 		data["errors"] = err.Error()
// 	} else {
// 		msg := fmt.Sprintf("Storage Service '%s' has been saved", service.Name)
// 		http.Redirect(w, r, "/storage_services?success="+url.QueryEscape(msg), 303)
// 		return nil
// 	}
// 	postUrl := fmt.Sprintf("/storage_service/%d/edit", id)
// 	data["form"] = forms.BootstrapFormFromModel(*service, forms.POST, postUrl)
// 	return env.ExecTemplate(w, "storage-service-form", data)
// }
