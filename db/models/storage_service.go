package models

import (
	"github.com/APTrust/go-form-it/fields"
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

// TransferProtocolOptions returns options for an HTML select list
// of available storage service protocol types ("s3", "ftp", etc.)
func TransferProtocolOptions() map[string][]fields.InputChoice {
	return OptionList(TransferProtocols)
}

// StorageServiceOptions returns options for an HTML select list of
// available StorageServices. The Id of each option is the StorageService ID,
// and the value is the StorageService name. Options are in alpho order
// by name.
func StorageServiceOptions(db *gorm.DB) map[string][]fields.InputChoice {
	choices := make([]fields.InputChoice, 1)
	choices[0] = fields.InputChoice{Id: "", Val: ""}
	services := make([]StorageService, 0)
	db.Select("id, name").Find(&services).Order("name")
	for _, ss := range services {
		choices = append(choices, fields.InputChoice{
			Id:  strconv.FormatUint(uint64(ss.ID), 10),
			Val: ss.Name})
	}
	options := make(map[string][]fields.InputChoice)
	options[""] = choices
	return options
}
