package handlers

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"github.com/gorilla/mux"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"github.com/kirves/go-form-it"
	_ "github.com/mattn/go-sqlite3"
	"log"
	"net/http"
	"net/url"
	"strconv"
)

func StorageServicesList(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	services := make([]models.StorageService, 0)
	db.Find(&services)
	data["items"] = services
	successMessage, ok := r.URL.Query()["success"]
	if ok {
		data["success"] = successMessage[0]
	}
	err := templates.ExecuteTemplate(w, "storage-service-list", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func StorageServiceNewGet(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	service := models.StorageService{}
	form := forms.BootstrapFormFromModel(service, forms.POST, "/storage_service/new")
	form.Field("Protocol").SetSelectChoices(GetOptions("Protocol"))
	data["form"] = form
	err := templates.ExecuteTemplate(w, "storage-service-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func StorageServiceNewPost(w http.ResponseWriter, r *http.Request) {
	err := r.ParseForm()
	if err != nil {
		log.Println("Error:", err.Error())
	}
	service := &models.StorageService{}
	err = decoder.Decode(service, r.PostForm)
	if err != nil {
		log.Println("Error:", err.Error())
	}
	data := make(map[string]interface{})
	err = db.Create(&service).Error
	postUrl := fmt.Sprintf("/storage_service/new")
	if err != nil {
		data["errors"] = err.Error()
		postUrl = fmt.Sprintf("/storage_service/%d/edit", service.ID)
	} else {
		msg := fmt.Sprintf("Storage Service '%s' has been saved", service.Name)
		http.Redirect(w, r, "/storage_services?success="+url.QueryEscape(msg), 303)
		return
	}
	data["form"] = forms.BootstrapFormFromModel(*service, forms.POST, postUrl)
	err = templates.ExecuteTemplate(w, "storage-service-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func StorageServiceEditGet(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"])
	log.Println("GET Storage Service", id)
	service := models.StorageService{}
	err := db.Find(&service, uint(id)).Error
	if err != nil {
		log.Println(err.Error())
	}
	// log.Println(service)
	postUrl := fmt.Sprintf("/storage_service/%d/edit", id)
	data := make(map[string]interface{})
	form := forms.BootstrapFormFromModel(service, forms.POST, postUrl)
	form.Field("Protocol").SetSelectChoices(GetOptions("Protocol"))
	form.Field("Protocol").SetValue(service.Protocol)
	data["form"] = form
	err = templates.ExecuteTemplate(w, "storage-service-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func StorageServiceEditPost(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"])
	log.Println("POST Storage Service", id)
	err := r.ParseForm()
	if err != nil {
		log.Println("Error:", err.Error())
	}
	service := &models.StorageService{}
	err = decoder.Decode(service, r.PostForm)
	if err != nil {
		log.Println("Error:", err.Error())
	}
	service.ID = uint(id)
	data := make(map[string]interface{})
	err = db.Save(&service).Error
	if err != nil {
		data["errors"] = err.Error()
	} else {
		msg := fmt.Sprintf("Storage Service '%s' has been saved", service.Name)
		http.Redirect(w, r, "/storage_services?success="+url.QueryEscape(msg), 303)
		return
	}
	postUrl := fmt.Sprintf("/storage_service/%d/edit", id)
	data["form"] = forms.BootstrapFormFromModel(*service, forms.POST, postUrl)
	err = templates.ExecuteTemplate(w, "storage-service-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}
