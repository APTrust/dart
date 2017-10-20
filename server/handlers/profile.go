package handlers

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"github.com/gorilla/mux"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"github.com/kirves/go-form-it"
	"github.com/kirves/go-form-it/fields"
	_ "github.com/mattn/go-sqlite3"
	"log"
	"net/http"
	"strconv"
)

func ProfileNewGet(w http.ResponseWriter, r *http.Request) {
	profile := models.BagItProfile{}
	form, err := ProfileForm(profile)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	data := make(map[string]interface{})
	data["form"] = form
	err = templates.ExecuteTemplate(w, "bagit-profile-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func ProfileNewPost(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	err := r.ParseForm()
	if err != nil {
		log.Println("Error:", err.Error())
	}
	profile := models.BagItProfile{}
	err = decoder.Decode(&profile, r.PostForm)
	if err != nil {
		log.Println("Error:", err.Error())
	}
	err = db.Save(&profile).Error
	if err != nil {
		log.Println("Error:", err.Error())
		data["errors"] = err.Error()
	} else {
		defaultTagValues := profile.DecodeDefaultTagValues(r.PostForm)
		log.Println(defaultTagValues)
		for _, val := range defaultTagValues {
			var valErr error
			if db.NewRecord(val) {
				log.Println("Creating", val.TagName, "=", val.TagValue)
				valErr = db.Create(&val).Error
			} else {
				log.Println("Updting", val.TagName, "=", val.TagValue)
				valErr = db.Save(&val).Error
			}
			if valErr != nil {
				log.Println("Error on", val.TagName, ":", valErr.Error())
				err = valErr
			}
		}
	}

	if err != nil {
		log.Println("Error:", err.Error())
		data["errors"] = err.Error()
	} else {
		http.Redirect(w, r, "/profiles?success=Profile+has+been+saved.", 303)
		return
	}

	form, err := ProfileForm(profile)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	data["form"] = form
	err = templates.ExecuteTemplate(w, "bagit-profile-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func ProfilesList(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	profiles := make([]models.BagItProfile, 0)
	db.Find(&profiles).Order("name")
	data["items"] = profiles
	successMessage, ok := r.URL.Query()["success"]
	if ok {
		data["success"] = successMessage[0]
	}
	err := templates.ExecuteTemplate(w, "bagit-profile-list", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func ProfileEditGet(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"])
	log.Println("GET profile", id)
	profile := models.BagItProfile{}
	db.Preload("DefaultTagValues").First(&profile, id)
	data := make(map[string]interface{})
	form, err := ProfileForm(profile)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	data["form"] = form
	err = templates.ExecuteTemplate(w, "bagit-profile-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func ProfileEditPost(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"])
	log.Println("POST profile", id)
	err := r.ParseForm()
	if err != nil {
		log.Println("Error:", err.Error())
	}
	profile := models.BagItProfile{}
	err = decoder.Decode(&profile, r.PostForm)
	if err != nil {
		log.Println("Error:", err.Error())
	}
	profile.ID = uint(id)
	err = db.Save(&profile).Error
	if err != nil {
		data["errors"] = err.Error()
	} else {
		defaultTagValues := profile.DecodeDefaultTagValues(r.PostForm)
		for _, val := range defaultTagValues {
			var valErr error
			if db.NewRecord(val) {
				log.Println("Creating", val.TagName, "=", val.TagValue)
				valErr = db.Create(&val).Error
			} else {
				log.Println("Updting", val.TagName, "=", val.TagValue)
				valErr = db.Save(&val).Error
			}
			if valErr != nil {
				log.Println("Error on", val.TagName, ":", valErr.Error())
				err = valErr
			}
		}
	}

	if err != nil {
		data["errors"] = err.Error()
	} else {
		http.Redirect(w, r, "/profiles?success=Profile+has+been+saved.", 303)
		return
	}

	form, err := ProfileForm(profile)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	data["form"] = form
	err = templates.ExecuteTemplate(w, "bagit-profile-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

// Returns a BagItProfile form.
func ProfileForm(profile models.BagItProfile) (*forms.Form, error) {
	postUrl := fmt.Sprintf("/profile/new")
	if profile.ID > uint(0) {
		postUrl = fmt.Sprintf("/profile/%d/edit", profile.ID)
	}
	form := forms.BootstrapFormFromModel(profile, forms.POST, postUrl)
	form.Field("JSON").AddCss("height", "300px")
	if profile.JSON == "" {
		return form, nil
	}

	// Remove the submit button from the end of the form,
	// add our new elements, and then replace the submit button
	// at the end.
	submitButton := form.Field("submit")
	form.RemoveElement("submit")

	// TODO: i18n
	fieldSetNote := fields.StaticField("",
		"Set common tag values for this profile below. "+
			"Common tag defaults such as your organization name "+
			"apply across all bags created with this profile. "+
			"Leave fields such as bag title, description, etc. "+
			"blank if they should be set individually for each bag.")
	fieldSetNote.AddClass("well")
	form.Elements(fieldSetNote)

	// Add the tag value fields we need to display.
	// Last param, false, means don't hide any fields.
	AddTagValueFields(profile, form, false)
	form.Elements(submitButton)

	return form, nil
}
