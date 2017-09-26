package main

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"github.com/APTrust/easy-store/util/testutil"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"path/filepath"
)

func main() {
	schemaPath, err := testutil.GetPathToSchema()
	if err != nil {
		panic(err.Error())
	}
	dbFilePath := filepath.Join(filepath.Dir(schemaPath), "..", "..", "easy-store.db")
	db, err := gorm.Open("sqlite3", dbFilePath)

	fmt.Println("Migrating DB", dbFilePath)
	db.AutoMigrate(
		&models.AppSetting{},
		&models.Bag{},
		&models.BagItProfile{},
		&models.DefaultTagValue{},
		&models.File{},
		&models.Job{},
		&models.StorageService{},
		&models.Tag{},
		&models.Workflow{},
	)

	defer db.Close()
}
