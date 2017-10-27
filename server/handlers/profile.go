package handlers

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"github.com/APTrust/go-form-it"
	"github.com/APTrust/go-form-it/fields"
	"github.com/gorilla/mux"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	_ "github.com/mattn/go-sqlite3"
	"github.com/pkg/errors"
	"net/http"
	"strconv"
)

// TODO: Start refactor here -->

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

func ProfileNewGet(env *Environment, w http.ResponseWriter, r *http.Request) error {
	profile := models.BagItProfile{}
	form, err := ProfileForm(profile)
	if err != nil {
		return errors.WithStack(err)
	}
	data := make(map[string]interface{})
	data["form"] = form
	return env.ExecTemplate(w, "bagit-profile-form", data)
}

func ProfileNewPost(env *Environment, w http.ResponseWriter, r *http.Request) error {
	data := make(map[string]interface{})
	err := r.ParseForm()
	if err != nil {
		return errors.WithStack(err)
	}
	profile := models.BagItProfile{}
	err = env.Decoder.Decode(&profile, r.PostForm)
	if err != nil {
		return errors.WithStack(err)
	}
	err = env.DB.Save(&profile).Error
	if err != nil {
		data["errors"] = err.Error()
	} else {
		defaultTagValues := profile.DecodeDefaultTagValues(r.PostForm)
		for _, val := range defaultTagValues {
			var valErr error
			if env.DB.NewRecord(val) {
				valErr = env.DB.Create(&val).Error
			} else {
				valErr = env.DB.Save(&val).Error
			}
			if valErr != nil {
				err = valErr
			}
		}
	}

	if err != nil {
		data["errors"] = err.Error()
	} else {
		http.Redirect(w, r, "/profiles?success=Profile+has+been+saved.", 303)
		return nil
	}

	form, err := ProfileForm(profile)
	if err != nil {
		return errors.WithStack(err)
	}
	data["form"] = form
	return env.ExecTemplate(w, "bagit-profile-form", data)
}

func ProfileEditGet(env *Environment, w http.ResponseWriter, r *http.Request) error {
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"])
	profile := models.BagItProfile{}
	env.DB.Preload("DefaultTagValues").First(&profile, id)
	data := make(map[string]interface{})
	form, err := ProfileForm(profile)
	if err != nil {
		return errors.WithStack(err)
	}
	data["form"] = form
	return env.ExecTemplate(w, "bagit-profile-form", data)
}

func ProfileEditPost(env *Environment, w http.ResponseWriter, r *http.Request) error {
	data := make(map[string]interface{})
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"])
	err := r.ParseForm()
	if err != nil {
		return errors.WithStack(err)
	}
	profile := models.BagItProfile{}
	err = env.Decoder.Decode(&profile, r.PostForm)
	if err != nil {
		return errors.WithStack(err)
	}
	profile.ID = uint(id)
	err = env.DB.Save(&profile).Error
	if err != nil {
		data["errors"] = err.Error()
	} else {
		defaultTagValues := profile.DecodeDefaultTagValues(r.PostForm)
		for _, val := range defaultTagValues {
			var valErr error
			if env.DB.NewRecord(val) {
				valErr = env.DB.Create(&val).Error
			} else {
				valErr = env.DB.Save(&val).Error
			}
			if valErr != nil {
				err = valErr
			}
		}
	}

	if err != nil {
		data["errors"] = err.Error()
	} else {
		http.Redirect(w, r, "/profiles?success=Profile+has+been+saved.", 303)
		return nil
	}

	form, err := ProfileForm(profile)
	if err != nil {
		return errors.WithStack(err)
	}
	data["form"] = form
	return env.ExecTemplate(w, "bagit-profile-form", data)
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
	submitButton := form.Field("submitButton")
	form.RemoveElement("submitButton")

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
