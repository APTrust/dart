package models_test

/* NOTE: main_test.go contains the TestMain, setup, and teardown functions for this suite. */

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestFileGetId(t *testing.T) {
	file := FakeFile()
	assert.Equal(t, file.Id, file.GetId())
}

func TestFileTableName(t *testing.T) {
	file := FakeFile()
	assert.Equal(t, "files", file.TableName())
}

func TestFileValidate(t *testing.T) {
	file := FakeFile()
	assert.True(t, file.Validate())
	assert.NotNil(t, file.Errors())
	assert.Empty(t, file.Errors())
}

func TestFileErrors(t *testing.T) {
	file := FakeFile()
	assert.NotNil(t, file.Errors())
	assert.Empty(t, file.Errors())
}

func TestFileSave(t *testing.T) {
	// Save as insert
	file := FakeFile()
	file.Id = 0
	ok := file.Save(false)
	assert.True(t, ok)
	assert.NotEqual(t, 0, file.Id)
	assert.Empty(t, file.Errors())

	// Save as update
	id := file.Id
	file.Size = file.Size + 20
	ok = file.Save(false)
	assert.True(t, ok)
	assert.Equal(t, id, file.Id)
	assert.Empty(t, file.Errors())
}

func TestGetFile(t *testing.T) {
	// Save first
	file := FakeFile()
	file.Id = 0
	ok := file.Save(false)
	assert.True(t, ok)
	assert.NotEqual(t, 0, file.Id)

	// Now get
	retrievedFile, err := models.GetFile(file.Id)
	require.Nil(t, err)
	assert.Equal(t, file.Id, retrievedFile.Id)
	assert.Equal(t, file.BagId, retrievedFile.BagId)
	assert.Equal(t, file.Name, retrievedFile.Name)
	assert.Equal(t, file.Size, retrievedFile.Size)
	assert.Equal(t, file.Md5, retrievedFile.Md5)
	assert.Equal(t, file.Sha256, retrievedFile.Sha256)
	assert.Equal(t, file.StorageURL, retrievedFile.StorageURL)
	assert.Equal(t, file.StoredAsPartOfBag, retrievedFile.StoredAsPartOfBag)
	assert.Equal(t, file.ETag, retrievedFile.ETag)
	assert.Equal(t, file.StoredAt, retrievedFile.StoredAt)
	assert.Equal(t, file.CreatedAt, retrievedFile.CreatedAt)
	assert.Equal(t, file.UpdatedAt, retrievedFile.UpdatedAt)
	assert.Empty(t, file.Errors())
}

func TestGetFiles(t *testing.T) {
	// Delete files created by other tests
	_, err := models.ExecCommand("delete from files", nil)
	require.Nil(t, err)

	// Save some first
	for i := 0; i < 10; i++ {
		file := FakeFile()
		file.Id = 0
		if i%2 == 0 {
			file.Name = fmt.Sprintf("Even %d", i)
		} else {
			file.Name = fmt.Sprintf("Odd %d", i)
		}
		if i%3 == 0 {
			file.StorageURL = ""
		}
		ok := file.Save(false)
		assert.True(t, ok)
		assert.NotEqual(t, 0, file.Id)
	}

	// Now select
	// Files 3 and 9 have Odd name and empty StorageURL
	where := "name like ? and storage_url = ?"
	values := []interface{}{
		"Odd%",
		"",
	}
	files, err := models.GetFiles(where, values)
	require.Nil(t, err)
	require.NotNil(t, files)
	assert.Equal(t, 2, len(files))

	// Should get ten files
	where = ""
	values = []interface{}{}
	files, err = models.GetFiles(where, values)
	require.Nil(t, err)
	require.NotNil(t, files)
	assert.Equal(t, 10, len(files))

	// Should also get ten files
	where = "name like 'Even %' or name like 'Odd%'"
	values = make([]interface{}, 0)
	files, err = models.GetFiles(where, values)
	require.Nil(t, err)
	require.NotNil(t, files)
	assert.Equal(t, 10, len(files))

	// Should get files
	where = "name like :name"
	values = []interface{}{
		"Even%",
	}
	files, err = models.GetFiles(where, values)
	require.Nil(t, err)
	require.NotNil(t, files)
	assert.Equal(t, 5, len(files))
}
