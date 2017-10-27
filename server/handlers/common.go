package handlers

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"github.com/APTrust/go-form-it"
	"github.com/APTrust/go-form-it/fields"
	"github.com/gorilla/mux"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	_ "github.com/mattn/go-sqlite3"
	"log"
	"net/http"
	"net/url"
	"strconv"
)

func HandleRootRequest(env *Environment, w http.ResponseWriter, r *http.Request) error {
	data := make(map[string]interface{})
	return env.ExecTemplate(w, "index", data)
}

// ParseRequest parses the data from the HTTP request and returns
// the id from the URL (or zero if there was no id), the combined
// values from the query string and the POST form, and any error
// that occurred during parsing.
func ParseRequest(r *http.Request) (uint, url.Values, error) {
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"]) // Ignore error: id may not be part of URL
	err := r.ParseForm()
	return uint(id), r.PostForm, err
}

// AddTagValueFields adds tag value form fields for a BagItProfile to
// the given form. Set the last param, hideNonEmpty, to true if you want
// to hide the fields that have non-empty values. Do this on the job form,
// for example, where the user fills in only those tags that don't already
// have default values.
func AddTagValueFields(profile models.BagItProfile, form *forms.Form, hideNonEmpty bool) error {
	profileDef, err := profile.Profile()
	if err != nil {
		return err
	}
	for _, relFilePath := range profileDef.SortedTagFilesRequired() {
		hasVisibleFields := false
		fieldsInSet := make([]fields.FieldInterface, 0)
		mapOfRequiredTags := profileDef.TagFilesRequired[relFilePath]
		for _, tagname := range profileDef.SortedTagNames(relFilePath) {
			// Payload-Oxum is a basic part of the BagIt spec and will
			// always be set by the system, not the user. Bag-Size is
			// a DPN tag that should also be set by the system.
			if tagname == "Payload-Oxum" || tagname == "Bag-Size" {
				continue
			}
			tagdef := mapOfRequiredTags[tagname]
			defaultTags := profile.GetDefaultTagValues(relFilePath, tagname)
			defaultValue := ""
			defaultTagId := uint(0)
			if len(defaultTags) > 0 {
				defaultValue = defaultTags[0].TagValue
				defaultTagId = defaultTags[0].ID
			}
			fieldName := fmt.Sprintf("%s|%s|%d", relFilePath, tagname, defaultTagId)
			fieldLabel := tagname

			formField := fields.TextField(fieldName)
			if len(tagdef.Values) > 0 {
				options := make(map[string][]fields.InputChoice)
				options[""] = make([]fields.InputChoice, len(tagdef.Values)+1)
				options[""][0] = fields.InputChoice{Id: "", Val: ""}
				for i, val := range tagdef.Values {
					options[""][i+1] = fields.InputChoice{Id: val, Val: val}
				}
				formField = fields.SelectField(fieldName, options)
			}
			formField.SetLabel(fieldLabel)
			formField.SetValue(defaultValue)
			if hideNonEmpty && defaultValue != "" {
				formField.AddClass("hidden")
				formField.AddClass("show-hide")
			} else {
				hasVisibleFields = true
			}
			fieldsInSet = append(fieldsInSet, formField)
		}
		fieldSet := forms.FieldSet(relFilePath, relFilePath, fieldsInSet...)
		form.Elements(fieldSet)
		if !hasVisibleFields {
			fieldSet.AddClass("hidden")
			fieldSet.AddClass("show-hide")
		}
	}
	return nil
}

// Used by middleware. Move there?
func LogRequest(r *http.Request) {
	r.ParseForm()
	log.Println(r.Method, r.URL.String())
	for k, v := range r.Form {
		log.Println("  ", k, "->", v[0])
	}
}
