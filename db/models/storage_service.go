package models

import (
	//	"github.com/APTrust/go-form-it/fields"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"strconv"
)

var TransferProtocols = []string{"ftp", "rsync", "s3", "sftp", "scp"}

type StorageService struct {
	gorm.Model     `form_options:"skip"`
	Name           string
	Description    string
	Protocol       string `form_widget:"select"`
	URL            string
	BucketOrFolder string
	LoginName      string
	LoginPassword  string `form_widget:"password"`
	LoginExtra     string `form_widget:"password"`
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
