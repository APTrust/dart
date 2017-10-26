package models_test

import (
	"github.com/APTrust/easy-store/db/models"
	//	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	//	"net/http"
	"testing"
)

func TestNewAppSetting(t *testing.T) {
	s := models.NewAppSetting("Custom name", "Custom value")
	assert.Equal(t, "Custom name", s.Name)
	assert.Equal(t, "Custom value", s.Value)
}

func TestAppSettingIsValid(t *testing.T) {
	s := models.NewAppSetting("Custom name", "Custom value")
	assert.True(t, s.IsValid())

	s.Name = ""
	assert.False(t, s.IsValid())
	assert.Equal(t, "Name is required.", s.Errors["Name"])

	s.Name = "OK"
	assert.True(t, s.IsValid())
	assert.Empty(t, s.Errors["Name"])

	s.Name = "   "
	assert.False(t, s.IsValid())
	assert.Equal(t, "Name is required.", s.Errors["Name"])
}

func TestAppSettingForm(t *testing.T) {
	s := models.NewAppSetting("Custom name", "Custom value")
	assert.Equal(t, "Custom name", s.Name)
	assert.Equal(t, "Custom value", s.Value)

	form := s.Form()
	assert.Equal(t, "/app_setting/new", form.Action)
	assert.Equal(t, "post", form.Method)
	require.NotNil(t, form.Fields["Name"])
	require.NotNil(t, form.Fields["Value"])
	assert.Equal(t, "name", form.Fields["Name"].Id)
	assert.Equal(t, "name", form.Fields["Name"].Name)
	assert.Equal(t, "Custom name", form.Fields["Name"].Value)
	assert.Equal(t, "value", form.Fields["Value"].Id)
	assert.Equal(t, "value", form.Fields["Value"].Name)
	assert.Equal(t, "Custom value", form.Fields["Value"].Value)

	s.ID = uint(33)
	form = s.Form()
	assert.Equal(t, "/app_setting/33/edit", form.Action)
}

func TestAppSettingFromRequest(t *testing.T) {
	db, err := InitTestDB()
	if db != nil {
		defer db.Close()
	}
	require.NotNil(t, db)
	require.Nil(t, err)
	setting, err := CreateFakeAppSetting(db)
	require.Nil(t, err)
	require.NotNil(t, setting)

	// TODO: Change AppSettingFromRequest so it does not rely on http.Request.
}
