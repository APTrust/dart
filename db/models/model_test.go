package models_test

import (
	"github.com/APTrust/easy-store/db/models"
	"github.com/jmoiron/sqlx"
	"github.com/stretchr/testify/assert"
	//	"github.com/stretchr/testify/require"
	_ "github.com/mattn/go-sqlite3"
	"io/ioutil"
	"os"
	"path/filepath"
	"testing"
)

var dbConn *sqlx.DB

func TestMain(m *testing.M) {
	dbFile := CreateTestDB()
	conn, err := sqlx.Connect("sqlite3", dbFile)
	if err != nil {
		panic(err.Error())
	}
	dbConn = conn
	code := m.Run()
	DeleteTestDB(dbFile)
	os.Exit(code)
}

func CreateTestDB() string {
	dir, err := ioutil.TempDir("", "example")
	if err != nil {
		panic(err.Error())
	}
	return filepath.Join(dir, "easy-store-test.db")
}

func DeleteTestDB(pathToDB string) {
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
