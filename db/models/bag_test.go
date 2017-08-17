package models_test

/* NOTE: main_test.go contains the TestMain, setup, and teardown functions for this suite. */

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestPrimaryKey(t *testing.T) {
	bag := FakeBag()
	assert.Equal(t, bag.Id, bag.PrimaryKey())
}

func TestTableName(t *testing.T) {
	bag := FakeBag()
	assert.Equal(t, "bags", bag.TableName())
}

func TestValidate(t *testing.T) {
	bag := FakeBag()
	assert.True(t, bag.Validate())
	assert.NotNil(t, bag.Errors())
	assert.Empty(t, bag.Errors())
}

func TestErrors(t *testing.T) {
	bag := FakeBag()
	assert.NotNil(t, bag.Errors())
	assert.Empty(t, bag.Errors())
}

func TestBagSave(t *testing.T) {
	// Save as insert
	bag := FakeBag()
	bag.Id = 0
	ok := bag.Save(false)
	assert.True(t, ok)
	assert.NotEqual(t, 0, bag.Id)

	// Save as update
	id := bag.Id
	bag.Size = bag.Size + 20
	ok = bag.Save(false)
	assert.True(t, ok)
	assert.Equal(t, id, bag.Id)
}

func TestGetBag(t *testing.T) {
	// Save first
	bag := FakeBag()
	bag.Id = 0
	ok := bag.Save(false)
	assert.True(t, ok)
	assert.NotEqual(t, 0, bag.Id)

	// Now get
	retrievedBag, err := models.GetBag(bag.Id)
	require.Nil(t, err)
	assert.Equal(t, bag.Id, retrievedBag.Id)
	assert.Equal(t, bag.Name, retrievedBag.Name)
}

func TestGetBags(t *testing.T) {
	// Delete bags created by other tests
	_, err := models.ExecCommand("delete from bags", nil)
	require.Nil(t, err)

	// Save some first
	for i := 0; i < 10; i++ {
		bag := FakeBag()
		bag.Id = 0
		if i%2 == 0 {
			bag.Name = fmt.Sprintf("Even %d", i)
		} else {
			bag.Name = fmt.Sprintf("Odd %d", i)
		}
		if i%3 == 0 {
			bag.MetadataURL = ""
		}
		ok := bag.Save(false)
		assert.True(t, ok)
		assert.NotEqual(t, 0, bag.Id)
	}

	// Now select
	// Bags 3 and 9 have Odd name and empty MetadataURL
	where := "name like :name and metadata_url = :metadata_url"
	values := map[string]interface{}{
		"name":         "Odd%",
		"metadata_url": "",
	}
	bags, err := models.GetBags(where, values)
	require.Nil(t, err)
	require.NotNil(t, bags)
	assert.Equal(t, 2, len(bags))

	// Should get ten bags
	where = ""
	values = map[string]interface{}{}
	bags, err = models.GetBags(where, values)
	require.Nil(t, err)
	require.NotNil(t, bags)
	assert.Equal(t, 10, len(bags))

	// Should also get ten bags
	where = "name like 'Even %' or name like 'Odd%'"
	values = map[string]interface{}{}
	bags, err = models.GetBags(where, values)
	require.Nil(t, err)
	require.NotNil(t, bags)
	assert.Equal(t, 10, len(bags))

	// Should get bags
	where = "name like :name"
	values = map[string]interface{}{
		"name": "Even%",
	}
	bags, err = models.GetBags(where, values)
	require.Nil(t, err)
	require.NotNil(t, bags)
	assert.Equal(t, 5, len(bags))
}
