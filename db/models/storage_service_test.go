package models_test

/* NOTE: main_test.go contains the TestMain, setup, and teardown functions for this suite. */

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestStorageServiceGetId(t *testing.T) {
	service := FakeStorageService()
	assert.Equal(t, service.Id, service.GetId())
}

func TestStorageServiceTableName(t *testing.T) {
	service := FakeStorageService()
	assert.Equal(t, "storage_services", service.TableName())
}

func TestStorageServiceValidate(t *testing.T) {
	service := FakeStorageService()
	assert.True(t, service.Validate())
	assert.NotNil(t, service.Errors())
	assert.Empty(t, service.Errors())
}

func TestStorageServiceErrors(t *testing.T) {
	service := FakeStorageService()
	assert.NotNil(t, service.Errors())
	assert.Empty(t, service.Errors())
}

func TestStorageServiceSave(t *testing.T) {
	// Save as insert
	service := FakeStorageService()
	service.Id = 0
	ok := service.Save(false)
	assert.True(t, ok)
	assert.NotEqual(t, 0, service.Id)
	assert.Empty(t, service.Errors())

	// Save as update
	id := service.Id
	service.Name = service.Name + "updated"
	ok = service.Save(false)
	assert.True(t, ok)
	assert.Equal(t, id, service.Id)
	assert.Empty(t, service.Errors())
}

func TestGetStorageService(t *testing.T) {
	// Save first
	service := FakeStorageService()
	service.Id = 0
	ok := service.Save(false)
	assert.True(t, ok)
	assert.NotEqual(t, 0, service.Id)

	// Now get
	retrievedService, err := models.GetStorageService(service.Id)
	require.Nil(t, err)
	assert.Equal(t, service.Id, retrievedService.Id)
	assert.Equal(t, service.Name, retrievedService.Name)
	assert.Equal(t, service.Description, retrievedService.Description)
	assert.Equal(t, service.Protocol, retrievedService.Protocol)
	assert.Equal(t, service.URL, retrievedService.URL)
	assert.Equal(t, service.BucketOrFolder, retrievedService.BucketOrFolder)
	assert.Equal(t, service.CredentialsId, retrievedService.CredentialsId)
	assert.Empty(t, service.Errors())
}

func TestGetStorageServices(t *testing.T) {
	// Delete services created by other tests
	_, err := models.ExecCommand("delete from storage_services", nil)
	require.Nil(t, err)

	// Save some first
	for i := 0; i < 10; i++ {
		service := FakeStorageService()
		service.Id = 0
		if i%2 == 0 {
			service.Name = fmt.Sprintf("Even %d", i)
		} else {
			service.Name = fmt.Sprintf("Odd %d", i)
		}
		if i%3 == 0 {
			service.Description = ""
		}
		ok := service.Save(false)
		assert.True(t, ok)
		assert.NotEqual(t, 0, service.Id)
	}

	// Now select
	// StorageServices 3 and 9 have Odd name and empty Description
	where := "name like ? and description = ?"
	values := []interface{}{
		"Odd%",
		"",
	}
	services, err := models.GetStorageServices(where, values)
	require.Nil(t, err)
	require.NotNil(t, services)
	assert.Equal(t, 2, len(services))

	// Should get ten services
	where = ""
	values = []interface{}{}
	services, err = models.GetStorageServices(where, values)
	require.Nil(t, err)
	require.NotNil(t, services)
	assert.Equal(t, 10, len(services))

	// Should also get ten services
	where = "name like 'Even %' or name like 'Odd%'"
	values = make([]interface{}, 0)
	services, err = models.GetStorageServices(where, values)
	require.Nil(t, err)
	require.NotNil(t, services)
	assert.Equal(t, 10, len(services))

	// Should get services
	where = "name like :name"
	values = []interface{}{
		"Even%",
	}
	services, err = models.GetStorageServices(where, values)
	require.Nil(t, err)
	require.NotNil(t, services)
	assert.Equal(t, 5, len(services))
}
