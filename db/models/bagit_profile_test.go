package models_test

/* NOTE: main_test.go contains the TestMain, setup, and teardown functions for this suite. */

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestProfileGetId(t *testing.T) {
	profile := FakeBagItProfile()
	assert.Equal(t, profile.Id, profile.GetId())
}

func TestProfileTableName(t *testing.T) {
	profile := FakeBagItProfile()
	assert.Equal(t, "bagit_profiles", profile.TableName())
}

func TestProfileValidate(t *testing.T) {
	profile := FakeBagItProfile()
	assert.True(t, profile.Validate())
	assert.NotNil(t, profile.Errors())
	assert.Empty(t, profile.Errors())
}

func TestProfileErrors(t *testing.T) {
	profile := FakeBagItProfile()
	assert.NotNil(t, profile.Errors())
	assert.Empty(t, profile.Errors())
}

func TestProfileSave(t *testing.T) {
	// Save as insert
	profile := FakeBagItProfile()
	profile.Id = 0
	ok := profile.Save(false)
	assert.True(t, ok)
	assert.NotEqual(t, 0, profile.Id)
	assert.Empty(t, profile.Errors())

	// Save as update
	id := profile.Id
	profile.Name = profile.Name + "updated"
	ok = profile.Save(false)
	assert.True(t, ok)
	assert.Equal(t, id, profile.Id)
	assert.Empty(t, profile.Errors())
}

func TestGetBagItProfile(t *testing.T) {
	// Save first
	profile := FakeBagItProfile()
	profile.Id = 0
	ok := profile.Save(false)
	assert.True(t, ok)
	assert.NotEqual(t, 0, profile.Id)

	// Now get
	retrievedProfile, err := models.GetBagItProfile(profile.Id)
	require.Nil(t, err)
	assert.Equal(t, profile.Id, retrievedProfile.Id)
	assert.Equal(t, profile.Name, retrievedProfile.Name)
	assert.Equal(t, profile.Description, retrievedProfile.Description)
	assert.Equal(t, profile.JSON, retrievedProfile.JSON)
	assert.Empty(t, profile.Errors())
}

func TestGetBagItProfiles(t *testing.T) {
	// Delete bags created by other tests
	_, err := models.ExecCommand("delete from bagit_profiles", nil)
	require.Nil(t, err)

	// Save some first
	for i := 0; i < 10; i++ {
		profile := FakeBagItProfile()
		profile.Id = 0
		if i%2 == 0 {
			profile.Name = fmt.Sprintf("Even %d", i)
		} else {
			profile.Name = fmt.Sprintf("Odd %d", i)
		}
		if i%3 == 0 {
			profile.Description = ""
		}
		ok := profile.Save(false)
		assert.True(t, ok)
		assert.NotEqual(t, 0, profile.Id)
	}

	// Now select
	// Bags 3 and 9 have Odd name and empty MetadataURL
	where := "name like ? and description = ?"
	values := []interface{}{
		"Odd%",
		"",
	}
	bags, err := models.GetBagItProfiles(where, values)
	require.Nil(t, err)
	require.NotNil(t, bags)
	assert.Equal(t, 2, len(bags))

	// Should get ten bags
	where = ""
	values = []interface{}{}
	bags, err = models.GetBagItProfiles(where, values)
	require.Nil(t, err)
	require.NotNil(t, bags)
	assert.Equal(t, 10, len(bags))

	// Should also get ten bags
	where = "name like 'Even %' or name like 'Odd%'"
	values = make([]interface{}, 0)
	bags, err = models.GetBagItProfiles(where, values)
	require.Nil(t, err)
	require.NotNil(t, bags)
	assert.Equal(t, 10, len(bags))

	// Should get bags
	where = "name like :name"
	values = []interface{}{
		"Even%",
	}
	bags, err = models.GetBagItProfiles(where, values)
	require.Nil(t, err)
	require.NotNil(t, bags)
	assert.Equal(t, 5, len(bags))
}
