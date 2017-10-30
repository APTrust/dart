package handlers

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	_ "github.com/mattn/go-sqlite3"
	"net/http"
	"net/url"
)

func ProfilesList(env *Environment, w http.ResponseWriter, r *http.Request) error {
	data := make(map[string]interface{})
	profiles := make([]models.BagItProfile, 0)
	env.DB.Find(&profiles).Order("name")
	data["items"] = profiles
	successMessage, ok := r.URL.Query()["success"]
	if ok {
		data["success"] = successMessage[0]
	}
	return env.ExecTemplate(w, "bagit-profile-list", data)
}

func ProfileGetForm(env *Environment, w http.ResponseWriter, r *http.Request) error {
	data := make(map[string]interface{})
	profile, err := ParseProfileRequest(env, http.MethodGet, r)
	if err != nil {
		return WrapErr(err)
	}
	form, err := profile.Form()
	if err != nil {
		return WrapErr(err)
	}
	data["form"] = form
	data["obj"] = profile
	return env.ExecTemplate(w, "bagit-profile-form", data)
}

func ProfilePostForm(env *Environment, w http.ResponseWriter, r *http.Request) error {
	data := make(map[string]interface{})
	profile, err := ParseProfileRequest(env, http.MethodPost, r)
	if err != nil {
		return WrapErr(err)
	}
	if profile.IsValid() {
		if profile.ID == 0 {
			err = env.DB.Create(&profile).Error
		} else {
			err = env.DB.Save(&profile).Error
		}
		if err != nil {
			return WrapErr(err)
		} else {
			msg := fmt.Sprintf("Profile '%s' has been saved", profile.Name)
			http.Redirect(w, r, "/profiles?success="+url.QueryEscape(msg), 303)
			return nil
		}
	}
	// Submitted data was not valid. Show the form with errors.
	form, err := profile.Form()
	if err != nil {
		return WrapErr(err)
	}
	data["form"] = form
	data["obj"] = profile
	return env.ExecTemplate(w, "bagit-profile-form", data)
}

func ParseProfileRequest(env *Environment, method string, r *http.Request) (*models.BagItProfile, error) {
	id, formValues, err := ParseRequest(r)
	if err != nil {
		return nil, err
	}
	return models.ProfileFromRequest(env.DB, method, id, formValues)
}
