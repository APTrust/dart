package models_test

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"github.com/jinzhu/gorm"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"testing"
)

func initStorageServiceTest() (*gorm.DB, []*models.StorageService, error) {
	services := make([]*models.StorageService, 3)
	db, err := InitTestDB()
	if err != nil {
		return nil, services, err
	}
	for i := 0; i < 3; i++ {
		p, err := CreateFakeStorageService(db)
		if err != nil {
			return nil, services, err
		}
		services[i] = p
	}
	return db, services, err
}

func TestTransferProtocolOptions(t *testing.T) {
	options := models.TransferProtocolOptions()
	require.Equal(t, len(models.TransferProtocols)+1, len(options))
	for i, allowed := range models.TransferProtocols {
		assert.Equal(t, allowed, options[i+1].Value)
		assert.Equal(t, allowed, options[i+1].Label)
	}
}

func TestStorageServiceOptions(t *testing.T) {
	db, services, err := initStorageServiceTest()
	if db != nil {
		defer db.Close()
	}
	require.Nil(t, err)
	assert.NotNil(t, db)
	choices := models.StorageServiceOptions(db)
	require.NotEmpty(t, choices)
	require.Equal(t, 4, len(choices))
	assert.Equal(t, "", choices[0].Value)
	assert.Equal(t, "", choices[0].Label)
	assert.Equal(t, fmt.Sprintf("%d", services[0].ID), choices[1].Value)
	assert.Equal(t, services[0].Name, choices[1].Label)
	assert.Equal(t, fmt.Sprintf("%d", services[1].ID), choices[2].Value)
	assert.Equal(t, services[1].Name, choices[2].Label)
	assert.Equal(t, fmt.Sprintf("%d", services[2].ID), choices[3].Value)
	assert.Equal(t, services[2].Name, choices[3].Label)
}

func TestIsValid(t *testing.T) {
	db, services, err := initStorageServiceTest()
	if db != nil {
		defer db.Close()
	}
	require.Nil(t, err)
	require.NotEmpty(t, services)

	service := services[0]
	assert.True(t, service.IsValid())

	service.Name = ""
	assert.False(t, service.IsValid())
	assert.Equal(t, "Name is required.", service.Errors["Name"])

	service.Name = "name"
	service.Protocol = ""
	assert.False(t, service.IsValid())
	assert.Equal(t, "Protocol is required.", service.Errors["Protocol"])

	service.Protocol = "protocol"
	service.URL = ""
	assert.False(t, service.IsValid())
	assert.Equal(t, "URL is required.", service.Errors["URL"])

	service.Name = ""
	service.Protocol = ""
	service.URL = ""
	assert.False(t, service.IsValid())
	assert.Equal(t, 3, len(service.Errors))
}

func TestForm(t *testing.T) {

}

func TestStorageServiceFromRequest(t *testing.T) {

}
