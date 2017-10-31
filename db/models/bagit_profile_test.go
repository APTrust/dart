package models_test

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"net/url"
	"strconv"
	"strings"
	"testing"
)

func initProfilesTest() (*gorm.DB, []*models.BagItProfile, error) {
	profiles := make([]*models.BagItProfile, 3)
	db, err := InitTestDB()
	if err != nil {
		return nil, profiles, err
	}
	for i := 0; i < 3; i++ {
		p, err := CreateFakeBagItProfileWithTags(db)
		if err != nil {
			return nil, profiles, err
		}
		profiles[i] = p
	}
	return db, profiles, err
}

func TestNewBagItProfile(t *testing.T) {
	profile := models.NewBagItProfile("name", "desc", `{"json": null}`)
	assert.Equal(t, "name", profile.Name)
	assert.Equal(t, "desc", profile.Description)
	assert.Equal(t, `{"json": null}`, profile.JSON)
	assert.NotNil(t, profile.DefaultTagValues)
}

func TestGetDefaultTagValues(t *testing.T) {
	db, profiles, err := initProfilesTest()
	if db != nil {
		defer db.Close()
	}
	require.Nil(t, err)
	require.NotNil(t, db)
	require.NotEmpty(t, profiles)
	profile := profiles[0]
	for _, dtv := range profile.DefaultTagValues {
		values := profile.GetDefaultTagValues(dtv.TagFile, dtv.TagName)
		for _, val := range values {
			assert.Equal(t, dtv.TagFile, val.TagFile)
			assert.Equal(t, dtv.TagName, val.TagName)
		}
	}
}

func TestDecodeDefaultTagValues(t *testing.T) {
	profile := models.NewBagItProfile("name", "desc", `{"json": null}`)
	profile.ID = 999
	values := url.Values{}
	for i := 0; i < 10; i++ {
		name := fmt.Sprintf("%d:tag_%d:file_%d", i, i, i)
		value := fmt.Sprintf("%d", i)
		values.Set(name, value)
	}
	decodedValues := profile.DecodeDefaultTagValues(values)
	for _, dtv := range decodedValues {
		assert.Equal(t, profile.ID, dtv.BagItProfileID)
		expectedTagId, _ := strconv.Atoi(dtv.TagValue)
		expectedTagFile := fmt.Sprintf("file_%d", expectedTagId)
		expectedTagName := fmt.Sprintf("tag_%d", expectedTagId)
		assert.Equal(t, uint(expectedTagId), dtv.ID)
		assert.Equal(t, expectedTagFile, dtv.TagFile)
		assert.Equal(t, expectedTagName, dtv.TagName)
	}
}

func TestProfileOptions(t *testing.T) {
	db, profiles, err := initProfilesTest()
	if db != nil {
		defer db.Close()
	}
	require.Nil(t, err)
	assert.NotNil(t, db)
	choices := models.ProfileOptions(db)
	require.NotEmpty(t, choices)
	require.Equal(t, 4, len(choices[""]))
	assert.Equal(t, "", choices[""][0].Id)
	assert.Equal(t, "", choices[""][0].Val)
	assert.Equal(t, fmt.Sprintf("%d", profiles[0].ID), choices[""][1].Id)
	assert.Equal(t, profiles[0].Name, choices[""][1].Val)
	assert.Equal(t, fmt.Sprintf("%d", profiles[1].ID), choices[""][2].Id)
	assert.Equal(t, profiles[1].Name, choices[""][2].Val)
	assert.Equal(t, fmt.Sprintf("%d", profiles[2].ID), choices[""][3].Id)
	assert.Equal(t, profiles[2].Name, choices[""][3].Val)
}

func TestSeriaizationOptions(t *testing.T) {
	options := models.SerializationFormatOptions()
	require.Equal(t, len(models.SerializationFormats)+1, len(options[""]))
	for i, allowed := range models.SerializationFormats {
		assert.Equal(t, allowed, options[""][i+1].Id)
		assert.Equal(t, allowed, options[""][i+1].Val)
	}
}

func TestProfileIsValid(t *testing.T) {
	db, profiles, err := initProfilesTest()
	if db != nil {
		defer db.Close()
	}
	require.Nil(t, err)
	require.NotNil(t, db)
	require.NotEmpty(t, profiles)
	profile := profiles[0]

	assert.True(t, profile.IsValid())

	profile.Name = ""
	assert.False(t, profile.IsValid())
	require.NotEmpty(t, profile.Errors)
	assert.Equal(t, "Name is required.", profile.Errors["Name"])

	profile.Name = "sample profile"
	profile.JSON = "  "
	assert.False(t, profile.IsValid())
	require.NotEmpty(t, profile.Errors)
	assert.Equal(t, "BagItProfile JSON is missing.", profile.Errors["JSON"])

	profile.JSON = `{"json": "nosj"}`
	assert.False(t, profile.IsValid())
	require.NotEmpty(t, profile.Errors)
	assert.True(t, strings.HasPrefix(profile.Errors["JSON"],
		"The BagItProfile described in the JSON text has the following errors"))
}
