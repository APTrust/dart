package models_test

import (
	"github.com/APTrust/easy-store/db/models"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"net/http"
	"net/url"
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

	setting1, err := models.AppSettingFromRequest(db, http.MethodGet, setting.ID, url.Values{})
	assert.Nil(t, err)
	assert.NotNil(t, setting1)
	assert.Equal(t, setting.ID, setting1.ID)
	assert.Equal(t, setting.Name, setting1.Name)
	assert.Equal(t, setting.Value, setting1.Value)

	values := url.Values{}
	values.Set("name", "Caesar")
	values.Set("value", "338")
	setting2, err := models.AppSettingFromRequest(db, http.MethodGet, uint(0), values)
	assert.Nil(t, err)
	assert.NotNil(t, setting2)
	assert.Equal(t, uint(0), setting2.ID)
	assert.Equal(t, "Caesar", setting2.Name)
	assert.Equal(t, "338", setting2.Value)

	setting3, err := models.AppSettingFromRequest(db, http.MethodPost, setting.ID, values)
	assert.Nil(t, err)
	assert.NotNil(t, setting3)
	assert.Equal(t, setting.ID, setting3.ID)
	assert.Equal(t, "Caesar", setting3.Name)
	assert.Equal(t, "338", setting3.Value)
}
