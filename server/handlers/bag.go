package handlers

import (
	"github.com/APTrust/easy-store/db/models"
	"github.com/gorilla/mux"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	_ "github.com/mattn/go-sqlite3"
	"github.com/pkg/errors"
	"net/http"
	"strconv"
)

func BagsList(env *Environment, w http.ResponseWriter, r *http.Request) error {
	data := make(map[string]interface{})
	bags := make([]models.Bag, 0)
	err := env.DB.Find(&bags).Error
	if err != nil {
		return errors.WithStack(err)
	}
	data["items"] = bags
	successMessage, ok := r.URL.Query()["success"]
	if ok {
		data["success"] = successMessage[0]
	}
	return env.Templates.ExecuteTemplate(w, "bag-list", data)
}

func BagDetail(env *Environment, w http.ResponseWriter, r *http.Request) error {
	data := make(map[string]interface{})
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"])
	bag := models.Bag{}
	err := env.DB.Find(&bag, id).Preload("Files").Error
	if err != nil {
		errors.WithStack(err)
	}
	data["item"] = bag
	data["items"] = bag.Files
	return env.Templates.ExecuteTemplate(w, "bag-detail", data)
}
