package models_test

import (
	//	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	//	"github.com/stretchr/testify/assert"
	//	"github.com/stretchr/testify/require"
	"testing"
)

func setup() (*gorm.DB, error) {
	db, err := gorm.Open("sqlite3", ":memory:")
	if err != nil {
		return nil, err
	}
	err = db.AutoMigrate(
		&models.AppSetting{},
		&models.Bag{},
		&models.BagItProfile{},
		&models.DefaultTagValue{},
		&models.File{},
		&models.Job{},
		&models.StorageService{},
		&models.Tag{},
		&models.Workflow{},
	).Error
	// Create Job, Workflow, BagItProfile, StorageService
	return db, err
}

func TestJobLoad(t *testing.T) {

}

func TestJobLoadWithRelations(t *testing.T) {

}
