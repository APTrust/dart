package models

import (
	"github.com/APTrust/go-form-it/fields"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
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

func TransferProtocolOptions() map[string][]fields.InputChoice {
	return OptionList(TransferProtocols)
}
