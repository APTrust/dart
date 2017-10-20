package handlers

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"github.com/APTrust/easy-store/util/testutil"
	"github.com/gorilla/schema"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"github.com/kirves/go-form-it"
	"github.com/kirves/go-form-it/fields"
	_ "github.com/mattn/go-sqlite3"
	"html/template"
	"log"
	"net/http"
	"path/filepath"
	"strconv"
)

// The following vars are shared among all files in this package.
var templates *template.Template
var decoder = schema.NewDecoder()
var db *gorm.DB

func HandleRootRequest(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	err := templates.ExecuteTemplate(w, "index", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func CompileTemplates(pathToServerRoot string) {
	templateDir, _ := filepath.Abs(filepath.Join(pathToServerRoot, "templates", "*.html"))
	log.Println("Loading templates:", templateDir)
	templates = template.Must(template.ParseGlob(templateDir))
}

// TODO: This is also used by the easy_store_setup app.
// Put it on one place, and don't rely on testutil.GetPathToSchema()
// as that file and directory exist in dev mode only, and users
// won't have them.
func InitDBConnection() {
	schemaPath, err := testutil.GetPathToSchema()
	if err != nil {
		panic(err.Error())
	}
	dbFilePath := filepath.Join(filepath.Dir(schemaPath), "..", "..", "easy-store.db")
	// This sets the main global var db.
	db, err = gorm.Open("sqlite3", dbFilePath)
	if err != nil {
		panic(err.Error())
	}
	db.LogMode(true)
}

func GetOptions(modelName string) map[string][]fields.InputChoice {
	// BagItProfile, StorageService
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
// the given form.
func AddTagValueFields(profile models.BagItProfile, form *forms.Form) error {
	profileDef, err := profile.Profile()
	if err != nil {
		return err
	}
	for _, relFilePath := range profileDef.SortedTagFilesRequired() {
		fieldsInSet := make([]fields.FieldInterface, 0)
		mapOfRequiredTags := profileDef.TagFilesRequired[relFilePath]
		for _, tagname := range profileDef.SortedTagNames(relFilePath) {
			// This tag is a basic part of the BagIt spec and will
			// always be set by the system, not the user.
			if tagname == "Payload-Oxum" {
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
			fieldsInSet = append(fieldsInSet, formField)
		}
		// Unfortunately, go-form-it does not support fieldset legends
		fieldSetLabel := fields.StaticField("", fmt.Sprintf("Default values for %s", relFilePath))
		fieldSetLabel.AddClass("fieldset-header")
		form.Elements(fieldSetLabel)
		fieldSet := forms.FieldSet(relFilePath, fieldsInSet...)
		form.Elements(fieldSet)
	}
	return nil
}
