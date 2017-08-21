package models_test

/* NOTE: main_test.go contains the TestMain, setup, and teardown functions for this suite. */

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestDefaultTagValueGetId(t *testing.T) {
	defaultTagValue := FakeDefaultTagValue()
	assert.Equal(t, defaultTagValue.Id, defaultTagValue.GetId())
}

func TestDefaultTagValueTableName(t *testing.T) {
	defaultTagValue := FakeDefaultTagValue()
	assert.Equal(t, "default_tag_values", defaultTagValue.TableName())
}

func TestDefaultTagValueValidate(t *testing.T) {
	defaultTagValue := FakeDefaultTagValue()
	assert.True(t, defaultTagValue.Validate())
	assert.NotNil(t, defaultTagValue.Errors())
	assert.Empty(t, defaultTagValue.Errors())
}

func TestDefaultTagValueErrors(t *testing.T) {
	defaultTagValue := FakeDefaultTagValue()
	assert.NotNil(t, defaultTagValue.Errors())
	assert.Empty(t, defaultTagValue.Errors())
}

func TestDefaultTagValueSave(t *testing.T) {
	// Save as insert
	defaultTagValue := FakeDefaultTagValue()
	defaultTagValue.Id = 0
	ok := defaultTagValue.Save(false)
	assert.True(t, ok)
	assert.NotEqual(t, 0, defaultTagValue.Id)
	assert.Empty(t, defaultTagValue.Errors())

	// Save as update
	id := defaultTagValue.Id
	defaultTagValue.TagName = defaultTagValue.TagName + "updated"
	ok = defaultTagValue.Save(false)
	assert.True(t, ok)
	assert.Equal(t, id, defaultTagValue.Id)
	assert.Empty(t, defaultTagValue.Errors())
}

func TestGetDefaultTagValue(t *testing.T) {
	// Save first
	defaultTagValue := FakeDefaultTagValue()
	defaultTagValue.Id = 0
	ok := defaultTagValue.Save(false)
	assert.True(t, ok)
	assert.NotEqual(t, 0, defaultTagValue.Id)

	// Now get
	retrievedDefaultTagValue, err := models.GetDefaultTagValue(defaultTagValue.Id)
	require.Nil(t, err)
	assert.Equal(t, defaultTagValue.Id, retrievedDefaultTagValue.Id)
	assert.Equal(t, defaultTagValue.ProfileId, retrievedDefaultTagValue.ProfileId)
	assert.Equal(t, defaultTagValue.TagFile, retrievedDefaultTagValue.TagFile)
	assert.Equal(t, defaultTagValue.TagName, retrievedDefaultTagValue.TagName)
	assert.Equal(t, defaultTagValue.TagValue, retrievedDefaultTagValue.TagValue)
	assert.Equal(t, defaultTagValue.UpdatedAt, retrievedDefaultTagValue.UpdatedAt)
	assert.Empty(t, defaultTagValue.Errors())
}

func TestGetDefaultTagValues(t *testing.T) {
	// Delete defaultTagValues created by other tests
	_, err := models.ExecCommand("delete from default_tag_values", nil)
	require.Nil(t, err)

	// Save some first
	for i := 0; i < 10; i++ {
		defaultTagValue := FakeDefaultTagValue()
		defaultTagValue.Id = 0
		if i%2 == 0 {
			defaultTagValue.TagName = fmt.Sprintf("Even %d", i)
		} else {
			defaultTagValue.TagName = fmt.Sprintf("Odd %d", i)
		}
		if i%3 == 0 {
			defaultTagValue.TagValue = ""
		}
		ok := defaultTagValue.Save(false)
		assert.True(t, ok)
		assert.NotEqual(t, 0, defaultTagValue.Id)
	}

	// Now select
	// DefaultTagValues 3 and 9 have Odd tag name and empty tag_value
	where := "tag_name like ? and tag_value = ?"
	values := []interface{}{
		"Odd%",
		"",
	}
	defaultTagValues, err := models.GetDefaultTagValues(where, values)
	require.Nil(t, err)
	require.NotNil(t, defaultTagValues)
	assert.Equal(t, 2, len(defaultTagValues))

	// Should get ten defaultTagValues
	where = ""
	values = []interface{}{}
	defaultTagValues, err = models.GetDefaultTagValues(where, values)
	require.Nil(t, err)
	require.NotNil(t, defaultTagValues)
	assert.Equal(t, 10, len(defaultTagValues))

	// Should also get ten defaultTagValues
	where = "tag_name like 'Even %' or tag_name like 'Odd%'"
	values = make([]interface{}, 0)
	defaultTagValues, err = models.GetDefaultTagValues(where, values)
	require.Nil(t, err)
	require.NotNil(t, defaultTagValues)
	assert.Equal(t, 10, len(defaultTagValues))

	// Should get defaultTagValues
	where = "tag_name like :name"
	values = []interface{}{
		"Even%",
	}
	defaultTagValues, err = models.GetDefaultTagValues(where, values)
	require.Nil(t, err)
	require.NotNil(t, defaultTagValues)
	assert.Equal(t, 5, len(defaultTagValues))
}
