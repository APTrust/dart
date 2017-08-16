package models_test

import (
	"github.com/APTrust/easy-store/db/models"
	"github.com/APTrust/easy-store/util/testutil"
	"github.com/jmoiron/sqlx"
	"github.com/stretchr/testify/assert"
	//	"github.com/stretchr/testify/require"
	_ "github.com/mattn/go-sqlite3"
	"io/ioutil"
	"os"
	"path/filepath"
	"testing"
)

// dbConn is the test database connection, which is shared by all tests.
var dbConn *sqlx.DB

// TestMain sets up our test suite, runs it, then deletes the test DB
// at the end. The setup (CreateTestDB) occurs before all tests in
// the models_test package are run, and the teardown (DeleteTestDB)
// occurs after all tests in the models_test package have completed.
func TestMain(m *testing.M) {
	dbFilePath := CreateTestDB()
	code := m.Run()
	DeleteTestDB(dbFilePath)
	os.Exit(code)
}

// CreateTestDB creates a temporary SQLite database for testing.
func CreateTestDB() string {
	dir, err := ioutil.TempDir("", "example")
	if err != nil {
		panic(err.Error())
	}
	dbFilePath := filepath.Join(dir, "easy-store-test.db")
	conn, err := sqlx.Connect("sqlite3", dbFilePath)
	if err != nil {
		panic(err.Error())
	}
	dbConn = conn

	// Load DB schema
	schemaPath, err := testutil.GetPathToSchema()
	if err != nil {
		panic(err.Error())
	}
	schema, err := ioutil.ReadFile(schemaPath)
	if err != nil {
		panic(err.Error())
	}
	dbConn.MustExec(string(schema))

	// Return the path to the DB file, so we can delete it later
	return dbFilePath
}

func DeleteTestDB(pathToDB string) {
	dbConn.Close()
	os.RemoveAll(filepath.Dir(pathToDB))
}

func TestSetAndGetConnection(t *testing.T) {
	models.SetConnection(models.DEFAULT_CONNECTION, dbConn)
	db := models.GetConnection(models.DEFAULT_CONNECTION)
	assert.NotNil(t, db)

	db = models.GetConnection("Does not exist")
	assert.Nil(t, db)
}

func TestColNames(t *testing.T) {

}

func TestColPlaceholders(t *testing.T) {

}

func TestInsertStatement(t *testing.T) {

}

func TestUpdateStatement(t *testing.T) {

}

func TestSaveStatement(t *testing.T) {

}

func TestSelectQuery(t *testing.T) {

}

func TestSelectByIdQuery(t *testing.T) {

}

func TestSelectWhere(t *testing.T) {

}

func TestAndAll(t *testing.T) {

}

func TestOrAll(t *testing.T) {

}
