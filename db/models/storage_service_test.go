package models_test

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"github.com/jinzhu/gorm"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"net/http"
	"net/url"
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
	db, services, err := initStorageServiceTest()
	if db != nil {
		defer db.Close()
	}
	require.Nil(t, err)
	require.NotEmpty(t, services)

	service := services[0]
	service.ID = 0
	form := service.Form()
	assert.Equal(t, "/storage_service/new", form.Action)
	assert.Equal(t, "post", form.Method)

	require.NotNil(t, form.Fields["Name"])
	assert.Equal(t, service.Name, form.Fields["Name"].Value)
	require.NotNil(t, form.Fields["Description"])
	assert.Equal(t, service.Description, form.Fields["Description"].Value)
	require.NotNil(t, form.Fields["Protocol"])
	assert.Equal(t, service.Protocol, form.Fields["Protocol"].Value)
	assert.NotEmpty(t, form.Fields["Protocol"].Choices)
	require.NotNil(t, form.Fields["URL"])
	assert.Equal(t, service.URL, form.Fields["URL"].Value)
	require.NotNil(t, form.Fields["BucketOrFolder"])
	assert.Equal(t, service.BucketOrFolder, form.Fields["BucketOrFolder"].Value)
	require.NotNil(t, form.Fields["LoginName"])
	assert.Equal(t, service.LoginName, form.Fields["LoginName"].Value)
	require.NotNil(t, form.Fields["LoginPassword"])
	assert.Equal(t, service.LoginPassword, form.Fields["LoginPassword"].Value)
	require.NotNil(t, form.Fields["LoginExtra"])
	assert.Equal(t, service.LoginExtra, form.Fields["LoginExtra"].Value)

	service.ID = uint(717)
	form = service.Form()
	assert.Equal(t, "/storage_service/717/edit", form.Action)
}

func TestStorageServiceFromRequest(t *testing.T) {
	db, services, err := initStorageServiceTest()
	if db != nil {
		defer db.Close()
	}
	require.Nil(t, err)
	require.NotEmpty(t, services)
	service := services[0]

	service1, err := models.StorageServiceFromRequest(db, http.MethodGet, service.ID, url.Values{})
	assert.Nil(t, err)
	assert.NotNil(t, service1)
	assert.Equal(t, service.ID, service1.ID)
	assert.Equal(t, service.Name, service1.Name)
	assert.Equal(t, service.Description, service1.Description)
	assert.Equal(t, service.Protocol, service1.Protocol)
	assert.Equal(t, service.URL, service1.URL)
	assert.Equal(t, service.BucketOrFolder, service1.BucketOrFolder)
	assert.Equal(t, service.LoginName, service1.LoginName)
	assert.Equal(t, service.LoginPassword, service1.LoginPassword)
	assert.Equal(t, service.LoginExtra, service1.LoginExtra)

	values := url.Values{}
	values.Set("name", "Generic S3")
	values.Set("description", "Amazon's Simple Storage Service")
	values.Set("protocol", "s3")
	values.Set("url", "https://example.com")
	values.Set("folder", "folder1")
	values.Set("loginName", "jeff")
	values.Set("loginPassword", "bezos")
	values.Set("loginExtra", "billgates")
	service2, err := models.StorageServiceFromRequest(db, http.MethodGet, uint(0), values)
	assert.Nil(t, err)
	assert.NotNil(t, service2)
	testSSValues(t, service2, http.MethodGet)

	service3, err := models.StorageServiceFromRequest(db, http.MethodPost, uint(0), values)
	assert.Nil(t, err)
	assert.NotNil(t, service3)
	testSSValues(t, service3, http.MethodPost)
}

func testSSValues(t *testing.T, service *models.StorageService, method string) {
	// Say whether failure occurred on GET or POST.
	message := fmt.Sprintf("Method = %s", method)

	assert.Equal(t, uint(0), service.ID, message)
	assert.Equal(t, "Generic S3", service.Name, message)
	assert.Equal(t, "Amazon's Simple Storage Service", service.Description, message)
	assert.Equal(t, "s3", service.Protocol, message)
	assert.Equal(t, "https://example.com", service.URL, message)
	assert.Equal(t, "jeff", service.LoginName, message)
	assert.Equal(t, "bezos", service.LoginPassword, message)
	assert.Equal(t, "billgates", service.LoginExtra, message)
}
