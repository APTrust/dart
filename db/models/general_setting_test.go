package models_test

/* NOTE: main_test.go contains the TestMain, setup, and teardown functions for this suite. */

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestGeneralSettingGetId(t *testing.T) {
	setting := FakeGeneralSetting()
	assert.Equal(t, setting.Id, setting.GetId())
}

func TestGeneralSettingTableName(t *testing.T) {
	setting := FakeGeneralSetting()
	assert.Equal(t, "general_settings", setting.TableName())
}

func TestGeneralSettingValidate(t *testing.T) {
	setting := FakeGeneralSetting()
	assert.True(t, setting.Validate())
	assert.NotNil(t, setting.Errors())
	assert.Empty(t, setting.Errors())
}

func TestGeneralSettingErrors(t *testing.T) {
	setting := FakeGeneralSetting()
	assert.NotNil(t, setting.Errors())
	assert.Empty(t, setting.Errors())
}

func TestGeneralSettingSave(t *testing.T) {
	// Save as insert
	setting := FakeGeneralSetting()
	setting.Id = 0
	ok := setting.Save(false)
	assert.True(t, ok)
	assert.NotEqual(t, 0, setting.Id)
	assert.Empty(t, setting.Errors())

	// Save as update
	id := setting.Id
	setting.Name = setting.Name + "updated"
	ok = setting.Save(false)
	assert.True(t, ok)
	assert.Equal(t, id, setting.Id)
	assert.Empty(t, setting.Errors())
}

func TestGetGeneralSetting(t *testing.T) {
	// Save first
	setting := FakeGeneralSetting()
	setting.Id = 0
	ok := setting.Save(false)
	assert.True(t, ok)
	assert.NotEqual(t, 0, setting.Id)

	// Now get
	retrievedGeneralSetting, err := models.GetGeneralSetting(setting.Id)
	require.Nil(t, err)
	assert.Equal(t, setting.Id, retrievedGeneralSetting.Id)
	assert.Equal(t, setting.Name, retrievedGeneralSetting.Name)
	assert.Equal(t, setting.Value, retrievedGeneralSetting.Value)
	assert.Empty(t, setting.Errors())
}

func TestGetGeneralSettings(t *testing.T) {
	// Delete settings created by other tests
	_, err := models.ExecCommand("delete from general_settings", nil)
	require.Nil(t, err)

	// Save some first
	for i := 0; i < 10; i++ {
		setting := FakeGeneralSetting()
		setting.Id = 0
		if i%2 == 0 {
			setting.Name = fmt.Sprintf("Even %d", i)
		} else {
			setting.Name = fmt.Sprintf("Odd %d", i)
		}
		if i%3 == 0 {
			setting.Value = ""
		}
		ok := setting.Save(false)
		assert.True(t, ok)
		assert.NotEqual(t, 0, setting.Id)
	}

	// Now select
	// GeneralSettings 3 and 9 have Odd name and empty value
	where := "name like ? and value = ?"
	values := []interface{}{
		"Odd%",
		"",
	}
	settings, err := models.GetGeneralSettings(where, values)
	require.Nil(t, err)
	require.NotNil(t, settings)
	assert.Equal(t, 2, len(settings))

	// Should get ten settings
	where = ""
	values = []interface{}{}
	settings, err = models.GetGeneralSettings(where, values)
	require.Nil(t, err)
	require.NotNil(t, settings)
	assert.Equal(t, 10, len(settings))

	// Should also get ten settings
	where = "name like 'Even %' or name like 'Odd%'"
	values = make([]interface{}, 0)
	settings, err = models.GetGeneralSettings(where, values)
	require.Nil(t, err)
	require.NotNil(t, settings)
	assert.Equal(t, 10, len(settings))

	// Should get settings
	where = "name like :name"
	values = []interface{}{
		"Even%",
	}
	settings, err = models.GetGeneralSettings(where, values)
	require.Nil(t, err)
	require.NotNil(t, settings)
	assert.Equal(t, 5, len(settings))
}
