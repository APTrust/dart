package models_test

/* NOTE: main_test.go contains the TestMain, setup, and teardown functions for this suite. */

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestCredentialsGetId(t *testing.T) {
	credentials := FakeCredentials()
	assert.Equal(t, credentials.Id, credentials.GetId())
}

func TestCredentialsTableName(t *testing.T) {
	credentials := FakeCredentials()
	assert.Equal(t, "credentials", credentials.TableName())
}

func TestCredentialsValidate(t *testing.T) {
	credentials := FakeCredentials()
	assert.True(t, credentials.Validate())
	assert.NotNil(t, credentials.Errors())
	assert.Empty(t, credentials.Errors())
}

func TestCredentialsErrors(t *testing.T) {
	credentials := FakeCredentials()
	assert.NotNil(t, credentials.Errors())
	assert.Empty(t, credentials.Errors())
}

func TestCredentialSave(t *testing.T) {
	// Save as insert
	credentials := FakeCredentials()
	credentials.Id = 0
	ok := credentials.Save(false)
	assert.True(t, ok)
	assert.NotEqual(t, 0, credentials.Id)
	assert.Empty(t, credentials.Errors())

	// Save as update
	id := credentials.Id
	credentials.Key = credentials.Key + "updated"
	ok = credentials.Save(false)
	assert.True(t, ok)
	assert.Equal(t, id, credentials.Id)
	assert.Empty(t, credentials.Errors())
}

func TestGetCredential(t *testing.T) {
	// Save first
	credentials := FakeCredentials()
	credentials.Id = 0
	ok := credentials.Save(false)
	assert.True(t, ok)
	assert.NotEqual(t, 0, credentials.Id)

	// Now get
	retrievedCredentials, err := models.GetCredential(credentials.Id)
	require.Nil(t, err)
	assert.Equal(t, credentials.Id, retrievedCredentials.Id)
	assert.Equal(t, credentials.Name, retrievedCredentials.Name)
	assert.Equal(t, credentials.Description, retrievedCredentials.Description)
	assert.Equal(t, credentials.Key, retrievedCredentials.Key)
	assert.Equal(t, credentials.Value, retrievedCredentials.Value)
	assert.Empty(t, credentials.Errors())
}

func TestGetCredentials(t *testing.T) {
	// Delete credentials created by other tests
	_, err := models.ExecCommand("delete from credentials", nil)
	require.Nil(t, err)

	// Save some first
	for i := 0; i < 10; i++ {
		credentials := FakeCredentials()
		credentials.Id = 0
		if i%2 == 0 {
			credentials.Name = fmt.Sprintf("Even %d", i)
		} else {
			credentials.Name = fmt.Sprintf("Odd %d", i)
		}
		if i%3 == 0 {
			credentials.Value = ""
		}
		ok := credentials.Save(false)
		assert.True(t, ok)
		assert.NotEqual(t, 0, credentials.Id)
	}

	// Now select
	// Credentials 3 and 9 have Odd name and empty value
	where := "name like ? and value = ?"
	values := []interface{}{
		"Odd%",
		"",
	}
	credentials, err := models.GetCredentials(where, values)
	require.Nil(t, err)
	require.NotNil(t, credentials)
	assert.Equal(t, 2, len(credentials))

	// Should get ten credentials
	where = ""
	values = []interface{}{}
	credentials, err = models.GetCredentials(where, values)
	require.Nil(t, err)
	require.NotNil(t, credentials)
	assert.Equal(t, 10, len(credentials))

	// Should also get ten credentials
	where = "name like 'Even %' or name like 'Odd%'"
	values = make([]interface{}, 0)
	credentials, err = models.GetCredentials(where, values)
	require.Nil(t, err)
	require.NotNil(t, credentials)
	assert.Equal(t, 10, len(credentials))

	// Should get credentials
	where = "name like :name"
	values = []interface{}{
		"Even%",
	}
	credentials, err = models.GetCredentials(where, values)
	require.Nil(t, err)
	require.NotNil(t, credentials)
	assert.Equal(t, 5, len(credentials))
}
