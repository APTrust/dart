package main

// easy_store_setup sets up the SQLite database.
// It may perform other setup tasks in the future.

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"github.com/APTrust/easy-store/util/fileutil"
	"github.com/APTrust/easy-store/util/testutil"
	"github.com/jmoiron/sqlx"
	_ "github.com/mattn/go-sqlite3"
	"io/ioutil"
	"path/filepath"
)

const (
	APTProfile = "APTrust 2.0"
	DPNProfile = "DPN 2.0"
	APTFile    = "aptrust_bagit_profile_2.0.json"
	DPNFile    = "dpn_bagit_profile.json"
)

func main() {
	schemaPath, dbFilePath := getPaths()
	dbConn := initDBConn(dbFilePath)
	if !fileutil.FileExists(dbFilePath) {
		fmt.Println("Initializing DB at", dbFilePath)
		initDB(dbConn, schemaPath)
	} else {
		fmt.Println("DB already exists at", dbFilePath)
	}
	loadProfiles(dbConn)
}

// getPaths returns the paths to the DB schema file and to
// the db file.
func getPaths() (string, string) {
	schemaPath, err := testutil.GetPathToSchema()
	if err != nil {
		panic(err.Error())
	}
	dbFilePath := filepath.Join(filepath.Dir(schemaPath), "..", "..", "easy-store.db")
	return schemaPath, dbFilePath
}

func initDBConn(dbFilePath string) *sqlx.DB {
	conn, err := sqlx.Connect("sqlite3", dbFilePath)
	if err != nil {
		panic(err.Error())
	}
	// Set the default connection, so other tests
	// can save/retrieve objects from the DB
	models.SetConnection(models.DEFAULT_CONNECTION, conn)
	return conn
}

// initDB initializes the SQLite database
func initDB(dbConn *sqlx.DB, schemaPath string) {
	// Load DB schema
	schema, err := ioutil.ReadFile(schemaPath)
	if err != nil {
		panic(err.Error())
	}
	dbConn.MustExec(string(schema))
}

func loadProfiles(dbConn *sqlx.DB) {
	aptProfile := getProfile(APTProfile)
	dpnProfile := getProfile(DPNProfile)
	if aptProfile == nil {
		loadProfile(APTProfile)
		fmt.Println("Loaded", APTProfile)
	} else {
		fmt.Println("Profile", APTProfile, "is already in DB")
	}
	if dpnProfile == nil {
		loadProfile(DPNProfile)
		fmt.Println("Loaded", DPNProfile)
	} else {
		fmt.Println("Profile", DPNProfile, "is already in DB")
	}
}

func loadProfile(name string) {
	whichFile := ""
	if name == APTProfile {
		whichFile = APTFile
	} else if name == DPNProfile {
		whichFile = DPNFile
	} else {
		panic("Unknown BagIt profile")
	}
	filePath, err := testutil.GetPathToTestProfile(whichFile)
	jsonString, err := ioutil.ReadFile(filePath)
	if err != nil {
		panic(err.Error())
	}
	profile := &models.BagItProfile{
		Name:        name,
		Description: "Built-in BagIt profile for " + name,
		JSON:        string(jsonString),
	}
	if !profile.Save(true) {
		msg := fmt.Sprintf("Error installing %s profile in DB: %s", name, profile.Errors()[0])
		panic(msg)
	}
}

func getProfile(name string) (profile *models.BagItProfile) {
	profiles, err := models.GetBagItProfiles("name = ?", []interface{}{name})
	if err != nil {
		panic(err.Error())
	}
	if len(profiles) > 0 {
		profile = profiles[0]
	}
	return profile
}
