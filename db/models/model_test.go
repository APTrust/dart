package models_test

import (
	"github.com/APTrust/easy-store/db/models"
	_ "github.com/mattn/go-sqlite3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"testing"
	"time"
)

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

var ExpectedSettingCols = []string{
	"id",
	"name",
	"value",
}

var BagInsertStatement = "insert into bags (name, size, storage_url, metadata_url, storage_registry_identifier, stored_at, created_at, updated_at) values (:name, :size, :storage_url, :metadata_url, :storage_registry_identifier, :stored_at, :created_at, :updated_at)"

var BagUpdateStatement = "update bags set name = :name, size = :size, storage_url = :storage_url, metadata_url = :metadata_url, storage_registry_identifier = :storage_registry_identifier, stored_at = :stored_at, created_at = :created_at, updated_at = :updated_at where id = :id"

var SettingInsertStatement = "insert into general_settings (name, value) values (:name, :value)"

var SettingUpdateStatement = "update general_settings set name = :name, value = :value where id = :id"

var ExpectedBagPlaceholders = []string{"?", "?", "?", "?", "?", "?", "?", "?", "?"}
var ExpectedSettingPlaceholders = []string{"?", "?", "?"}

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

	setting := &models.GeneralSetting{}
	settingCols := models.ColNames(setting, true)
	assert.Equal(t, ExpectedSettingCols, settingCols)
}

func TestColPlaceholders(t *testing.T) {
	bag := &models.Bag{}
	expected := ExpectedBagPlaceholders
	bagPlaceholders := models.ColPlaceholders(bag, true)
	assert.Equal(t, expected, bagPlaceholders)

	setting := &models.GeneralSetting{}
	expected = ExpectedSettingPlaceholders
	settingPlaceholders := models.ColPlaceholders(setting, true)
	assert.Equal(t, expected, settingPlaceholders)
}

func TestInsertStatement(t *testing.T) {
	bag := &models.Bag{}
	statement := models.InsertStatement(bag)
	assert.Equal(t, BagInsertStatement, statement)

	setting := &models.GeneralSetting{}
	statement = models.InsertStatement(setting)
	assert.Equal(t, SettingInsertStatement, statement)
}

func TestUpdateStatement(t *testing.T) {
	bag := &models.Bag{}
	statement := models.UpdateStatement(bag)
	assert.Equal(t, BagUpdateStatement, statement)

	setting := &models.GeneralSetting{}
	statement = models.UpdateStatement(setting)
	assert.Equal(t, SettingUpdateStatement, statement)
}

func TestSaveStatement(t *testing.T) {
	// Should get update statement for non-zero id...
	bag := &models.Bag{}
	statement := models.UpdateStatement(bag)
	assert.Equal(t, BagUpdateStatement, statement)

	setting := &models.GeneralSetting{}
	statement = models.UpdateStatement(setting)
	assert.Equal(t, SettingUpdateStatement, statement)

	// ...and insert statement for zero id.
	bag.Id = 0
	statement = models.SaveStatement(bag)
	assert.Equal(t, BagInsertStatement, statement)

	setting.Id = 0
	statement = models.InsertStatement(setting)
	assert.Equal(t, SettingInsertStatement, statement)
}

func TestSelectQuery(t *testing.T) {
	bag := &models.Bag{}
	query := models.SelectQuery(bag)
	expected := "select id, name, size, storage_url, metadata_url, storage_registry_identifier, stored_at, created_at, updated_at from bags"
	assert.Equal(t, expected, query)

	setting := &models.GeneralSetting{}
	query = models.SelectQuery(setting)
	expected = "select id, name, value from general_settings"
	assert.Equal(t, expected, query)
}

func TestSelectByIdQuery(t *testing.T) {
	bag := &models.Bag{}
	query := models.SelectByIdQuery(bag)
	expected := "select id, name, size, storage_url, metadata_url, storage_registry_identifier, stored_at, created_at, updated_at from bags where id = ?"
	assert.Equal(t, expected, query)

	setting := &models.GeneralSetting{}
	query = models.SelectByIdQuery(setting)
	expected = "select id, name, value from general_settings where id = ?"
	assert.Equal(t, expected, query)
}

func TestSelectWhere(t *testing.T) {
	bag := &models.Bag{}
	query := models.SelectWhere(bag, "name = :name and stored_at > :stored_at")
	expected := "select id, name, size, storage_url, metadata_url, storage_registry_identifier, stored_at, created_at, updated_at from bags where name = :name and stored_at > :stored_at"
	assert.Equal(t, expected, query)

	setting := &models.GeneralSetting{}
	query = models.SelectWhere(setting, "key = :key and value is not null")
	expected = "select id, name, value from general_settings where key = :key and value is not null"
	assert.Equal(t, expected, query)
}

func TestAndAll(t *testing.T) {
	params := map[string]interface{}{
		"name": "Jim",
		"age":  44,
	}
	// No telling what order keys will come out in.
	expected1 := "(age = :age and name = :name)"
	expected2 := "(name = :name and age = :age)"
	actual := models.AndAll(params)
	assert.True(t, (actual == expected1 || actual == expected2))
}

func TestOrAll(t *testing.T) {
	params := map[string]interface{}{
		"name": "Jim",
		"age":  44,
	}
	expected1 := "(age = :age or name = :name)"
	expected2 := "(name = :name or age = :age)"
	actual := models.OrAll(params)
	assert.True(t, (actual == expected1 || actual == expected2))
}

func TestGetOptions(t *testing.T) {
	_, err := models.ExecCommand("delete from bagit_profiles", nil)
	require.Nil(t, err)
	_, err = models.ExecCommand("delete from storage_services", nil)
	require.Nil(t, err)

	for i := 0; i < 2; i++ {
		profile := FakeBagItProfile()
		profile.Id = 0
		assert.True(t, profile.Save(false))
		time.Sleep(50 * time.Millisecond)

		service := FakeStorageService()
		service.Id = 0
		assert.True(t, service.Save(false))
		time.Sleep(50 * time.Millisecond)
	}

	opts := models.GetOptions("BagItProfile")
	assert.Equal(t, 2, len(opts[""]))

	opts = models.GetOptions("StorageService")
	assert.Equal(t, 2, len(opts[""]))
}
