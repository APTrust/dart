package models

import (
	"encoding/json"
	"github.com/APTrust/easy-store/bagit"
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
	Name              string
	Size              int64
	Md5               string    `form_options:"skip"`
	Sha256            string    `form_options:"skip"`
	StorageURL        string    `form_options:"skip"`
	StoredAsPartOfBag bool      `form_options:"skip"`
	ETag              string    `form_options:"skip"`
	StoredAt          time.Time `form_options:"skip"`
}

type BagItProfile struct {
	gorm.Model       `form_options:"skip"`
	Name             string
	Description      string
	JSON             string `form_widget:"textarea"`
	DefaultTagValues []DefaultTagValue
}

func (profile *BagItProfile) Profile() (*bagit.BagItProfile, error) {
	bagItProfile := &bagit.BagItProfile{}
	err := json.Unmarshal([]byte(profile.JSON), bagItProfile)
	return bagItProfile, err
}

type DefaultTagValue struct {
	gorm.Model `form_options:"skip"`
	TagFile    string
	TagName    string
	TagValue   string
}

type AppSetting struct {
	gorm.Model `form_options:"skip"`
	Name       string
	Value      string
}

type Job struct {
	gorm.Model         `form_options:"skip"`
	Bag                Bag       `form_widget:"select"`
	File               File      `form_widget:"select"`
	Workflow           Workflow  `form_widget:"select"`
	WorkflowSnapshot   string    `form_options:"skip"`
	ScheduledStartTime time.Time `form_options:"skip"`
	StartedAt          time.Time `form_options:"skip"`
	FinishedAt         time.Time `form_options:"skip"`
	Pid                int       `form_options:"skip"`
	Outcome            string    `form_options:"skip"`
	CapturedOutput     string    `form_options:"skip"`
}

type StorageService struct {
	gorm.Model     `form_options:"skip"`
	Name           string
	Description    string
	Protocol       string
	URL            string
	BucketOrFolder string
	LoginName      string
	LoginPassword  string `form_widget:"password"`
	LoginExtra     string `form_widget:"password"`
}

type Tag struct {
	gorm.Model  `form_options:"skip"`
	Bag         Bag `form_widget:"select"`
	RelFilePath string
	Name        string
	Value       string
}

type Workflow struct {
	gorm.Model          `form_options:"skip"`
	Name                string
	Description         string
	SerializationFormat string         `form_widget:"select"`
	BagItProfile        BagItProfile   `form_widget:"select"`
	StorageService      StorageService `form_widget:"select"`
}
