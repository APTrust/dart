package models

import (
	"encoding/json"
	"github.com/APTrust/easy-store/bagit"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"time"
)

type Bag struct {
	gorm.Model
	Name             string
	Size             int64
	Files            []File
	StorageURL       string
	MetadataURL      string
	RemoteIdentifier string
	StoredAt         time.Time
}

type File struct {
	gorm.Model
	Name              string
	Size              int64
	Md5               string
	Sha256            string
	StorageURL        string
	StoredAsPartOfBag bool
	ETag              string
	StoredAt          time.Time
}

type BagItProfile struct {
	gorm.Model
	Name             string
	Description      string
	JSON             string
	DefaultTagValues []DefaultTagValue
}

func (profile *BagItProfile) Profile() (*bagit.BagItProfile, error) {
	bagItProfile := &bagit.BagItProfile{}
	err := json.Unmarshal([]byte(profile.JSON), bagItProfile)
	return bagItProfile, err
}

type DefaultTagValue struct {
	gorm.Model
	TagFile  string
	TagName  string
	TagValue string
}

type AppSetting struct {
	gorm.Model
	Name  string
	Value string
}

type Job struct {
	gorm.Model
	Bag                Bag
	File               File
	Workflow           Workflow
	WorkflowSnapshot   string
	ScheduledStartTime time.Time
	StartedAt          time.Time
	FinishedAt         time.Time
	Pid                int
	Outcome            string
	CapturedOutput     string
}

type StorageService struct {
	gorm.Model
	Name           string
	Description    string
	Protocol       string
	URL            string
	BucketOrFolder string
	LoginName      string
	LoginPassword  string
	LoginExtra     string
}

type Tag struct {
	gorm.Model
	Bag         Bag
	RelFilePath string
	Name        string
	Value       string
}

type Workflow struct {
	gorm.Model
	Name                string
	Description         string
	SerializationFormat string
	BagItProfile        BagItProfile
	StorageService      StorageService
}
