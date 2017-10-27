package models

import (
	"encoding/json"
	"fmt"
	"github.com/APTrust/easy-store/bagit"
	"github.com/APTrust/go-form-it/fields"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"net/http"
	"net/url"
	"strconv"
	"strings"
)

var SerializationFormats = []string{"gzip", "tar", "zip"}

type BagItProfile struct {
	gorm.Model       `form_options:"skip"`
	Name             string
	Description      string
	JSON             string            `form_widget:"textarea"`
	DefaultTagValues []DefaultTagValue `form_options:"skip"`
	Errors           map[string]string `sql:"-"`
}

func NewBagItProfile(name, description, jsonString string) *BagItProfile {
	return &BagItProfile{
		Name:             name,
		Description:      description,
		JSON:             jsonString,
		DefaultTagValues: make([]DefaultTagValue, 0),
	}
}

// Profile returns the underlying bagit.BagItProfile from the parsed JSON.
func (profile *BagItProfile) Profile() (*bagit.BagItProfile, error) {
	bagItProfile := &bagit.BagItProfile{}
	err := json.Unmarshal([]byte(profile.JSON), bagItProfile)
	return bagItProfile, err
}

// GetDefaultTagValues returns the default tag values for the specified
// tagName within the specified tagFile.
func (profile *BagItProfile) GetDefaultTagValues(tagFile, tagName string) []DefaultTagValue {
	defaults := make([]DefaultTagValue, 0)
	for _, dtv := range profile.DefaultTagValues {
		if dtv.TagFile == tagFile && dtv.TagName == tagName {
			defaults = append(defaults, dtv)
		}
	}
	return defaults
}

// DecodeDefaultTagValues parses tag values submitted as part of an HTML form.
func (profile *BagItProfile) DecodeDefaultTagValues(data map[string][]string) []DefaultTagValue {
	values := make([]DefaultTagValue, 0)
	for key, value := range data {
		if !strings.Contains(key, "|") {
			continue
		}
		keyParts := strings.Split(key, "|")
		//tagFile, tagName, tagId
		dtv := DefaultTagValue{
			BagItProfileID: uint(profile.ID),
			TagFile:        keyParts[0],
			TagName:        keyParts[1],
			TagValue:       value[0],
		}
		id, _ := strconv.Atoi(keyParts[2])
		dtv.ID = uint(id)
		values = append(values, dtv)
	}
	return values
}

// ProfileOptions returns a list of HTML select options with the
// name and id of each BagItProfile in the database. Options are
// in alpha order by name. The option value is the profile Id,
// and the option label is the profile name.
func ProfileOptions(db *gorm.DB) map[string][]fields.InputChoice {
	choices := make([]fields.InputChoice, 1)
	choices[0] = fields.InputChoice{Id: "", Val: ""}
	profiles := make([]BagItProfile, 0)
	db.Select("id, name").Find(&profiles).Order("name")
	for _, profile := range profiles {
		choices = append(choices, fields.InputChoice{
			Id:  strconv.FormatUint(uint64(profile.ID), 10),
			Val: profile.Name})
	}
	options := make(map[string][]fields.InputChoice)
	options[""] = choices
	return options
}

// SerializationFormatOptions returns a list of bag serialization formats,
// such as "tar", "gzip", etc.
func SerializationFormatOptions() map[string][]fields.InputChoice {
	return OptionList(SerializationFormats)
}

// IsValid returns true if this object is valid and can be saved in the
// database. If this is not valid, it will set error messages in the
// BagItProfile.Errors map.
func (profile *BagItProfile) IsValid() bool {
	isValid := true
	profile.Errors = make(map[string]string)
	if strings.TrimSpace(profile.Name) == "" {
		isValid = false
		profile.Errors["Name"] = "Name is required."
	}
	if strings.TrimSpace(profile.JSON) == "" {
		isValid = false
		profile.Errors["JSON"] = "BagItProfile JSON is missing."
	} else {
		bagItProfile, err := profile.Profile()
		if err != nil {
			isValid = false
			profile.Errors["JSON"] = fmt.Sprintf("BagItProfile JSON is malformed or invalid: %v", err)
		} else {
			errors := bagItProfile.Validate()
			if len(errors) > 0 {
				isValid = false
				profile.Errors["JSON"] = "The BagItProfile described in the JSON text has the following errors:\n"
				for _, e := range errors {
					profile.Errors["JSON"] += fmt.Sprintf("%v\n", e)
				}
			}
		}
	}
	return isValid
}

// Form returns a form object suitable for rendering an HTML form for
// this BagItProfile.
func (profile *BagItProfile) Form() *Form {
	return nil
}

// ProfileFromRequest returns a BagItProfile object based on data in
// an HTTP request.
func ProfileFromRequest(db *gorm.DB, method string, id uint, values url.Values) (*BagItProfile, error) {
	if method == http.MethodGet && id != uint(0) {
		profile := NewBagItProfile("", "", "")
		err := db.Find(&profile, uint(id)).Error
		return profile, err
	}
	profile := NewBagItProfile(
		values.Get("name"),
		values.Get("description"),
		values.Get("json"))
	profile.ID = uint(id)
	return profile, nil
}
