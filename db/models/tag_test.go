package models_test

/* NOTE: main_test.go contains the TestMain, setup, and teardown functions for this suite. */

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestTagGetId(t *testing.T) {
	tag := FakeTag()
	assert.Equal(t, tag.Id, tag.GetId())
}

func TestTagTableName(t *testing.T) {
	tag := FakeTag()
	assert.Equal(t, "tags", tag.TableName())
}

func TestTagValidate(t *testing.T) {
	tag := FakeTag()
	assert.True(t, tag.Validate())
	assert.NotNil(t, tag.Errors())
	assert.Empty(t, tag.Errors())
}

func TestTagErrors(t *testing.T) {
	tag := FakeTag()
	assert.NotNil(t, tag.Errors())
	assert.Empty(t, tag.Errors())
}

func TestTagSave(t *testing.T) {
	// Save as insert
	tag := FakeTag()
	tag.Id = 0
	ok := tag.Save(false)
	assert.True(t, ok)
	assert.NotEqual(t, 0, tag.Id)
	assert.Empty(t, tag.Errors())

	// Save as update
	id := tag.Id
	tag.Value = tag.Value + "updated"
	ok = tag.Save(false)
	assert.True(t, ok)
	assert.Equal(t, id, tag.Id)
	assert.Empty(t, tag.Errors())
}

func TestGetTag(t *testing.T) {
	// Save first
	tag := FakeTag()
	tag.Id = 0
	ok := tag.Save(false)
	assert.True(t, ok)
	assert.NotEqual(t, 0, tag.Id)

	// Now get
	retrievedTag, err := models.GetTag(tag.Id)
	require.Nil(t, err)
	assert.Equal(t, tag.Id, retrievedTag.Id)
	assert.Equal(t, tag.BagId, retrievedTag.BagId)
	assert.Equal(t, tag.Name, retrievedTag.Name)
	assert.Equal(t, tag.Value, retrievedTag.Value)
	assert.Empty(t, tag.Errors())
}

func TestGetTags(t *testing.T) {
	// Delete tags created by other tests
	_, err := models.ExecCommand("delete from tags", nil)
	require.Nil(t, err)

	// Save some first
	for i := 0; i < 10; i++ {
		tag := FakeTag()
		tag.Id = 0
		if i%2 == 0 {
			tag.Name = fmt.Sprintf("Even %d", i)
		} else {
			tag.Name = fmt.Sprintf("Odd %d", i)
		}
		if i%3 == 0 {
			tag.Value = ""
		}
		ok := tag.Save(false)
		assert.True(t, ok)
		assert.NotEqual(t, 0, tag.Id)
	}

	// Now select
	// Tags 3 and 9 have Odd name and empty value
	where := "name like ? and value = ?"
	values := []interface{}{
		"Odd%",
		"",
	}
	tags, err := models.GetTags(where, values)
	require.Nil(t, err)
	require.NotNil(t, tags)
	assert.Equal(t, 2, len(tags))

	// Should get ten tags
	where = ""
	values = []interface{}{}
	tags, err = models.GetTags(where, values)
	require.Nil(t, err)
	require.NotNil(t, tags)
	assert.Equal(t, 10, len(tags))

	// Should also get ten tags
	where = "name like 'Even %' or name like 'Odd%'"
	values = make([]interface{}, 0)
	tags, err = models.GetTags(where, values)
	require.Nil(t, err)
	require.NotNil(t, tags)
	assert.Equal(t, 10, len(tags))

	// Should get tags
	where = "name like :name"
	values = []interface{}{
		"Even%",
	}
	tags, err = models.GetTags(where, values)
	require.Nil(t, err)
	require.NotNil(t, tags)
	assert.Equal(t, 5, len(tags))
}
