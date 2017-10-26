package models

import (
	"encoding/json"
	"github.com/APTrust/easy-store/bagit"
	"github.com/APTrust/go-form-it/fields"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
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
}

func (profile *BagItProfile) Profile() (*bagit.BagItProfile, error) {
	bagItProfile := &bagit.BagItProfile{}
	err := json.Unmarshal([]byte(profile.JSON), bagItProfile)
	return bagItProfile, err
}

func (profile *BagItProfile) GetDefaultTagValues(tagFile, tagName string) []DefaultTagValue {
	defaults := make([]DefaultTagValue, 0)
	for _, dtv := range profile.DefaultTagValues {
		if dtv.TagFile == tagFile && dtv.TagName == tagName {
			defaults = append(defaults, dtv)
		}
	}
	return defaults
}

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

func SerializationFormatOptions() map[string][]fields.InputChoice {
	return OptionList(SerializationFormats)
}
