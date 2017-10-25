package handlers

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"github.com/APTrust/go-form-it"
	"github.com/gorilla/mux"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	_ "github.com/mattn/go-sqlite3"
	"github.com/pkg/errors"
	"net/http"
	"net/url"
	"strconv"
)

func WorkflowsList(env *Environment, w http.ResponseWriter, r *http.Request) error {
	data := make(map[string]interface{})
	workflows := make([]models.Workflow, 0)
	err := env.DB.Find(&workflows).Error
	if err != nil {
		return errors.WithStack(err)
	}
	data["items"] = workflows
	successMessage, ok := r.URL.Query()["success"]
	if ok {
		data["success"] = successMessage[0]
	}
	return env.ExecTemplate(w, "workflow-list", data)
}

func WorkflowNewGet(env *Environment, w http.ResponseWriter, r *http.Request) error {
	workflow := models.Workflow{}
	postUrl := "/workflow/new"
	data := make(map[string]interface{})
	form := forms.BootstrapFormFromModel(workflow, forms.POST, postUrl)
	form.Field("SerializationFormat").SetSelectChoices(GetOptions("SerializationFormat"))
	form.Field("BagItProfileID").SetSelectChoices(GetOptions("BagItProfile"))
	form.Field("StorageServiceID").SetSelectChoices(GetOptions("StorageService"))
	data["form"] = form
	return env.ExecTemplate(w, "workflow-form", data)
}

func WorkflowNewPost(env *Environment, w http.ResponseWriter, r *http.Request) error {
	err := r.ParseForm()
	if err != nil {
		return errors.WithStack(err)
	}
	workflow := &models.Workflow{}
	err = env.Decoder.Decode(workflow, r.PostForm)
	if err != nil {
		return errors.WithStack(err)
	}
	data := make(map[string]interface{})
	postUrl := "/workflow/new"
	err = env.DB.Save(&workflow).Error
	if err != nil {
		data["errors"] = err.Error()
	} else {
		msg := fmt.Sprintf("Workflow '%s' has been saved", workflow.Name)
		http.Redirect(w, r, "/workflows?success="+url.QueryEscape(msg), 303)
		return nil
	}
	form := forms.BootstrapFormFromModel(*workflow, forms.POST, postUrl)
	form.Field("SerializationFormat").SetSelectChoices(GetOptions("SerializationFormat"))
	form.Field("SerializationFormat").SetValue(workflow.SerializationFormat)
	form.Field("BagItProfileID").SetSelectChoices(GetOptions("BagItProfile"))
	form.Field("BagItProfileID").SetValue(strconv.FormatUint(uint64(workflow.BagItProfileID), 10))
	form.Field("StorageServiceID").SetSelectChoices(GetOptions("StorageService"))
	form.Field("StorageServiceID").SetValue(strconv.FormatUint(uint64(workflow.StorageServiceID), 10))
	data["form"] = form
	return env.ExecTemplate(w, "workflow-form", data)
}

func WorkflowEditGet(env *Environment, w http.ResponseWriter, r *http.Request) error {
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"])
	workflow := models.Workflow{}
	env.DB.Find(&workflow, uint(id))
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
	return env.ExecTemplate(w, "workflow-form", data)
}

func WorkflowEditPost(env *Environment, w http.ResponseWriter, r *http.Request) error {
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"])
	err := r.ParseForm()
	if err != nil {
		return errors.WithStack(err)
	}
	workflow := &models.Workflow{}
	err = env.Decoder.Decode(workflow, r.PostForm)
	if err != nil {
		return errors.WithStack(err)
	}
	workflow.ID = uint(id)
	data := make(map[string]interface{})
	err = env.DB.Save(&workflow).Error
	if err != nil {
		data["errors"] = err.Error()
	} else {
		msg := fmt.Sprintf("Workflow '%s' has been saved.", workflow.Name)
		http.Redirect(w, r, "/workflows?success="+url.QueryEscape(msg), 303)
		return nil
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
	return env.ExecTemplate(w, "workflow-form", data)
}
