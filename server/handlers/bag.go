package handlers

import (
	"github.com/APTrust/easy-store/db/models"
	"github.com/gorilla/mux"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	_ "github.com/mattn/go-sqlite3"
	"log"
	"net/http"
	"strconv"
)

func BagsList(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	bags := make([]models.Bag, 0)
	err := db.Find(&bags).Error
	if err != nil {
		log.Println(err.Error())
	}
	data["items"] = bags
	successMessage, ok := r.URL.Query()["success"]
	if ok {
		data["success"] = successMessage[0]
	}
	err = templates.ExecuteTemplate(w, "bag-list", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func BagDetail(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"])
	log.Println("GET Bag", id)
	bag := models.Bag{}
	err := db.Find(&bag, id).Preload("Files").Error
	if err != nil {
		log.Println(err.Error())
	}
	data["item"] = bag
	data["items"] = bag.Files
	err = templates.ExecuteTemplate(w, "bag-detail", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}
