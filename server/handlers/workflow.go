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

func WorkflowsList(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	workflows := make([]models.Workflow, 0)
	err := db.Find(&workflows).Error
	if err != nil {
		log.Println(err.Error())
	}
	data["items"] = workflows
	successMessage, ok := r.URL.Query()["success"]
	if ok {
		data["success"] = successMessage[0]
	}
	err = templates.ExecuteTemplate(w, "workflow-list", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func WorkflowNewGet(w http.ResponseWriter, r *http.Request) {
	workflow := models.Workflow{}
	postUrl := "/workflow/new"
	data := make(map[string]interface{})
	form := forms.BootstrapFormFromModel(workflow, forms.POST, postUrl)
	form.Field("SerializationFormat").SetSelectChoices(GetOptions("SerializationFormat"))
	form.Field("BagItProfileID").SetSelectChoices(GetOptions("BagItProfile"))
	form.Field("StorageServiceID").SetSelectChoices(GetOptions("StorageService"))
	data["form"] = form
	err := templates.ExecuteTemplate(w, "workflow-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func WorkflowNewPost(w http.ResponseWriter, r *http.Request) {
	err := r.ParseForm()
	if err != nil {
		log.Println("Error:", err.Error())
	}
	workflow := &models.Workflow{}
	err = decoder.Decode(workflow, r.PostForm)
	if err != nil {
		log.Println("Error:", err.Error())
	}
	data := make(map[string]interface{})
	postUrl := "/workflow/new"
	err = db.Save(&workflow).Error
	if err != nil {
		data["errors"] = err.Error()
	} else {
		msg := fmt.Sprintf("Workflow '%s' has been saved", workflow.Name)
		http.Redirect(w, r, "/workflows?success="+url.QueryEscape(msg), 303)
		return
	}
	form := forms.BootstrapFormFromModel(*workflow, forms.POST, postUrl)
	form.Field("SerializationFormat").SetSelectChoices(GetOptions("SerializationFormat"))
	form.Field("SerializationFormat").SetValue(workflow.SerializationFormat)
	form.Field("BagItProfileID").SetSelectChoices(GetOptions("BagItProfile"))
	form.Field("BagItProfileID").SetValue(strconv.FormatUint(uint64(workflow.BagItProfileID), 10))
	form.Field("StorageServiceID").SetSelectChoices(GetOptions("StorageService"))
	form.Field("StorageServiceID").SetValue(strconv.FormatUint(uint64(workflow.StorageServiceID), 10))
	data["form"] = form
	err = templates.ExecuteTemplate(w, "workflow-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func WorkflowEditGet(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"])
	log.Println("GET Workflow", id)
	workflow := models.Workflow{}
	db.Find(&workflow, uint(id))
	postUrl := fmt.Sprintf("/workflow/%d/edit", id)
	data := make(map[string]interface{})
	form := forms.BootstrapFormFromModel(workflow, forms.POST, postUrl)
	form.Field("SerializationFormat").SetSelectChoices(GetOptions("SerializationFormat"))
	form.Field("SerializationFormat").SetValue(workflow.SerializationFormat)
	form.Field("BagItProfileID").SetSelectChoices(GetOptions("BagItProfile"))
	form.Field("BagItProfileID").SetValue(strconv.FormatUint(uint64(workflow.BagItProfileID), 10))
	form.Field("StorageServiceID").SetSelectChoices(GetOptions("StorageService"))
	form.Field("StorageServiceID").SetValue(strconv.FormatUint(uint64(workflow.StorageServiceID), 10))
	data["form"] = form
	err := templates.ExecuteTemplate(w, "workflow-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func WorkflowEditPost(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"])
	log.Println("POST Workflow", id)
	err := r.ParseForm()
	if err != nil {
		log.Println("Error:", err.Error())
	}
	workflow := &models.Workflow{}
	err = decoder.Decode(workflow, r.PostForm)
	if err != nil {
		log.Println("Error:", err.Error())
	}
	workflow.ID = uint(id)
	data := make(map[string]interface{})
	err = db.Save(&workflow).Error
	if err != nil {
		data["errors"] = err.Error()
	} else {
		msg := fmt.Sprintf("Workflow '%s' has been saved.", workflow.Name)
		http.Redirect(w, r, "/workflows?success="+url.QueryEscape(msg), 303)
		return
	}
	postUrl := fmt.Sprintf("/workflow/%d/edit", id)
	form := forms.BootstrapFormFromModel(*workflow, forms.POST, postUrl)
	form.Field("SerializationFormat").SetSelectChoices(GetOptions("SerializationFormat"))
	form.Field("SerializationFormat").SetValue(workflow.SerializationFormat)
	form.Field("BagItProfileID").SetSelectChoices(GetOptions("BagItProfile"))
	form.Field("BagItProfileID").SetValue(strconv.FormatUint(uint64(workflow.BagItProfileID), 10))
	form.Field("StorageServiceID").SetSelectChoices(GetOptions("StorageService"))
	form.Field("StorageServiceID").SetValue(strconv.FormatUint(uint64(workflow.StorageServiceID), 10))
	data["form"] = form
	err = templates.ExecuteTemplate(w, "workflow-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}
