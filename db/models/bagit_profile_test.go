package models_test

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
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
