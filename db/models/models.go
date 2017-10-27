package models

import (
	"github.com/APTrust/go-form-it/fields"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"time"
)

type Bag struct {
	gorm.Model       `form_options:"skip"`
	Name             string
	Size             int64
	Files            []File    `form_options:"skip"`
	StorageURL       string    `form_options:"skip"`
	MetadataURL      string    `form_options:"skip"`
	RemoteIdentifier string    `form_options:"skip"`
	StoredAt         time.Time `form_options:"skip"`
}

type File struct {
	gorm.Model        `form_options:"skip"`
	BagID             uint
	Name              string
	Size              int64
	Md5               string    `form_options:"skip"`
	Sha256            string    `form_options:"skip"`
	StorageURL        string    `form_options:"skip"`
	StoredAsPartOfBag bool      `form_options:"skip"`
	ETag              string    `form_options:"skip"`
	StoredAt          time.Time `form_options:"skip"`
}

type DefaultTagValue struct {
	gorm.Model     `form_options:"skip"`
	BagItProfileID uint
	TagFile        string
	TagName        string
	TagValue       string
}

type Tag struct {
	gorm.Model  `form_options:"skip"`
	BagID       uint `form_widget:"select"`
	RelFilePath string
	Name        string
	Value       string
}

// TODO: *** REPLACE WITH CHOICE LIST ***
// OptionsList returns a list of HTML Select Options for the specified list.
// The first item in the list is empty. The Id and Value of each remaining
// option match one item in the list.
func OptionList(items []string) map[string][]fields.InputChoice {
	choices := make([]fields.InputChoice, 1+len(items))
	choices[0] = fields.InputChoice{Id: "", Val: ""}
	for i, item := range items {
		choices[i+1] = fields.InputChoice{Id: item, Val: item}
	}
	options := make(map[string][]fields.InputChoice)
	options[""] = choices
	return options
}

// TODO: *** WILL REPLACE OPTION LIST ***
// ChoiceList returns a list of choices (options) suitable
// for an HTML select list or radio group.
func ChoiceList(items []string) []Choice {
	choices := make([]Choice, 1+len(items))
	choices[0] = Choice{Value: "", Label: ""}
	for i, item := range items {
		choices[i+1] = Choice{Value: item, Label: item}
	}
	return choices
}
