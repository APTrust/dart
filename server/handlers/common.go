package handlers

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"github.com/APTrust/go-form-it"
	"github.com/APTrust/go-form-it/fields"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	_ "github.com/mattn/go-sqlite3"
	"log"
	"net/http"
	"strconv"
)

func HandleRootRequest(env *Environment, w http.ResponseWriter, r *http.Request) error {
	data := make(map[string]interface{})
	return env.ExecTemplate(w, "index", data)
}

// TODO: Move into models
func GetOptions(db *gorm.DB, modelName string) map[string][]fields.InputChoice {
	choices := make([]fields.InputChoice, 1)
	choices[0] = fields.InputChoice{Id: "", Val: ""}
	if modelName == "BagItProfile" {
		profiles := make([]models.BagItProfile, 0)
		db.Select("id, name").Find(&profiles).Order("name")
		for _, profile := range profiles {
			choices = append(choices, fields.InputChoice{
				Id:  strconv.FormatUint(uint64(profile.ID), 10),
				Val: profile.Name})
		}
	} else if modelName == "StorageService" {
		services := make([]models.StorageService, 0)
		db.Select("id, name").Find(&services).Order("name")
		for _, service := range services {
			choices = append(choices, fields.InputChoice{
				Id:  strconv.FormatUint(uint64(service.ID), 10),
				Val: service.Name})
		}
	} else if modelName == "Workflow" {
		workflows := make([]models.Workflow, 0)
		db.Select("id, name").Find(&workflows).Order("name")
		for _, workflow := range workflows {
			choices = append(choices, fields.InputChoice{
				Id:  strconv.FormatUint(uint64(workflow.ID), 10),
				Val: workflow.Name})
		}
	} else if modelName == "SerializationFormat" {
		choices = append(choices, fields.InputChoice{Id: "gzip", Val: "gzip"})
		choices = append(choices, fields.InputChoice{Id: "tar", Val: "tar"})
		choices = append(choices, fields.InputChoice{Id: "zip", Val: "zip"})
	} else if modelName == "Protocol" {
		choices = append(choices, fields.InputChoice{Id: "ftp", Val: "ftp"})
		choices = append(choices, fields.InputChoice{Id: "rsync", Val: "rsync"})
		choices = append(choices, fields.InputChoice{Id: "s3", Val: "s3"})
		choices = append(choices, fields.InputChoice{Id: "scp", Val: "scp"})
	}
	options := make(map[string][]fields.InputChoice)
	options[""] = choices
	return options
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
