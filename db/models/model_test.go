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

var ExpectedBagCols = []string{
	"id",
	"name",
	"size",
	"storage_url",
	"metadata_url",
	"storage_registry_identifier",
	"stored_at",
	"created_at",
	"updated_at",
}

var ExpectedCredentialsCols = []string{
	"id",
	"name",
	"description",
	"key",
	"value",
}

var BagInsertStatement = "insert into bags (name, size, storage_url, metadata_url, storage_registry_identifier, stored_at, created_at, updated_at) values (:name, :size, :storage_url, :metadata_url, :storage_registry_identifier, :stored_at, :created_at, :updated_at)"

var BagUpdateStatement = "update bags set name = :name, size = :size, storage_url = :storage_url, metadata_url = :metadata_url, storage_registry_identifier = :storage_registry_identifier, stored_at = :stored_at, created_at = :created_at, updated_at = :updated_at where id = :id"

var CredentialsInsertStatement = "insert into credentials (name, description, key, value) values (:name, :description, :key, :value)"

var CredentialsUpdateStatement = "update credentials set name = :name, description = :description, key = :key, value = :value where id = :id"

func ExpectedBagPlaceholders() []string {
	list := make([]string, len(ExpectedBagCols))
	for i, colName := range ExpectedBagCols {
		list[i] = ":" + colName
	}
	return list
}

func ExpectedCredentialsPlaceholders() []string {
	list := make([]string, len(ExpectedCredentialsCols))
	for i, colName := range ExpectedCredentialsCols {
		list[i] = ":" + colName
	}
	return list
}

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

	// Set the default connection, so other tests
	// can save/retrieve objects from the DB
	models.SetConnection(models.DEFAULT_CONNECTION, dbConn)

	// Return the path to the DB file, so we can delete it later
	return dbFilePath
}

// DeleteTestDB deletes the test SQLite db file when tests complete.
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
	bag := &models.Bag{}
	bagCols := models.ColNames(bag, true)
	assert.Equal(t, ExpectedBagCols, bagCols)

	credentials := &models.Credentials{}
	credentialsCols := models.ColNames(credentials, true)
	assert.Equal(t, ExpectedCredentialsCols, credentialsCols)
}

func TestColPlaceholders(t *testing.T) {
	bag := &models.Bag{}
	expected := ExpectedBagPlaceholders()
	bagPlaceholders := models.ColPlaceholders(bag, true)
	assert.Equal(t, expected, bagPlaceholders)

	credentials := &models.Credentials{}
	expected = ExpectedCredentialsPlaceholders()
	credentialsPlaceholders := models.ColPlaceholders(credentials, true)
	assert.Equal(t, expected, credentialsPlaceholders)
}

func TestInsertStatement(t *testing.T) {
	bag := &models.Bag{}
	statement := models.InsertStatement(bag)
	assert.Equal(t, BagInsertStatement, statement)

	credentials := &models.Credentials{}
	statement = models.InsertStatement(credentials)
	assert.Equal(t, CredentialsInsertStatement, statement)
}

func TestUpdateStatement(t *testing.T) {
	bag := &models.Bag{}
	statement := models.UpdateStatement(bag)
	assert.Equal(t, BagUpdateStatement, statement)

	credentials := &models.Credentials{}
	statement = models.UpdateStatement(credentials)
	assert.Equal(t, CredentialsUpdateStatement, statement)
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
