package models

import (
	"fmt"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"net/http"
	"net/url"
	"strconv"
)

var TransferProtocols = []string{"ftp", "rsync", "s3", "sftp", "scp"}

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
	Errors         map[string]string `sql:"-"`
}

func NewStorageService(name string) *StorageService {
	return &StorageService{
		Name: name,
	}
}

// TransferProtocolOptions returns options for an HTML select list
// of available storage service protocol types ("s3", "ftp", etc.)
func TransferProtocolOptions() []Choice {
	return ChoiceList(TransferProtocols)
}

func StorageServiceOptions(db *gorm.DB) []Choice {
	choices := make([]Choice, 1)
	choices[0] = Choice{Value: "", Label: ""}
	services := make([]StorageService, 0)
	db.Select("id, name").Find(&services).Order("name")
	for _, service := range services {
		choices = append(choices, Choice{
			Value: strconv.FormatUint(uint64(service.ID), 10),
			Label: service.Name})
	}
	return choices
}

func (service *StorageService) IsValid() bool {
	service.Errors = make(map[string]string)
	if service.Name == "" {
		service.Errors["Name"] = "Name is required."
	}
	if service.Protocol == "" {
		service.Errors["Protocol"] = "Protocol is required."
	}
	if service.URL == "" {
		service.Errors["URL"] = "URL is required."
	}
	return len(service.Errors) > 0
}

func (service *StorageService) Form() *Form {
	action := "/storage_service/new"
	method := "post"
	if service.ID != 0 {
		action = fmt.Sprintf("/storage_service/%d/edit", service.ID)
	}
	form := NewForm(action, method)

	// Name
	nameField := NewField("name", "name", "Name", service.Name)
	nameField.Help = "* Required"
	form.Fields["Name"] = nameField

	// Description
	form.Fields["Description"] = NewField("description", "description", "Description", service.Description)

	// Protocol
	protocolField := NewField("protocol", "protocol", "Protocol", service.Protocol)
	protocolField.Help = "* Required"
	form.Fields["Protocol"] = protocolField

	// URL
	URLField := NewField("url", "url", "URL", service.URL)
	URLField.Help = "* Required"
	form.Fields["URL"] = URLField

	// BucketOrFolder
	form.Fields["BucketOrFolder"] = NewField("folder", "folder", "Bucket or Folder", service.BucketOrFolder)

	// LoginName
	form.Fields["LoginName"] = NewField("loginName", "loginName", "Login Name", service.LoginName)

	// LoginPassword
	form.Fields["LoginPassword"] = NewField("loginPassword", "loginPassword", "Login Password", service.LoginPassword)

	// LoginExtra
	form.Fields["LoginExtra"] = NewField("loginExtra", "loginExtra", "Login Extra", service.LoginExtra)

	form.SetErrors(service.Errors)
	return form
}

func StorageServiceFromRequest(db *gorm.DB, method string, id uint, values url.Values) (*StorageService, error) {
	if method == http.MethodGet && id != uint(0) {
		service := NewStorageService("")
		err := db.Find(&service, uint(id)).Error
		return service, err
	}
	service := NewStorageService(values.Get("name"))
	service.ID = uint(id)
	service.Description = values.Get("description")
	service.Protocol = values.Get("protocol")
	service.URL = values.Get("url")
	service.BucketOrFolder = values.Get("bucketOrFolder")
	service.LoginName = values.Get("loginName")
	service.LoginPassword = values.Get("loginPassword")
	service.LoginExtra = values.Get("loginExtra")

	return service, nil
}
