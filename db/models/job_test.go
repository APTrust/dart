package models_test

import (
	"github.com/APTrust/easy-store/db/models"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"testing"
)

func setupJobTest() (*gorm.DB, uint, error) {
	db, err := InitTestDB()
	if err != nil {
		return nil, uint(0), err
	}
	job, err := CreateFakeJobWithRelations(db)
	if err != nil {
		return nil, uint(0), err
	}
	return db, job.ID, err
}

func TestJobLoad(t *testing.T) {
	db, objectId, err := setupJobTest()
	if db != nil {
		defer db.Close()
	}
	require.Nil(t, err)
	assert.NotEqual(t, uint(0), objectId)
	job, err := models.JobLoad(db, objectId)
	assert.Nil(t, err)
	require.NotNil(t, job)
	assert.Equal(t, objectId, job.ID)
}

func TestJobLoadWithRelations(t *testing.T) {
	db, objectId, err := setupJobTest()
	if db != nil {
		defer db.Close()
	}
	require.Nil(t, err)
	assert.NotEqual(t, uint(0), objectId)
	job, err := models.JobLoadWithRelations(db, objectId)
	assert.Nil(t, err)
	require.NotNil(t, job)
	assert.Equal(t, objectId, job.ID)
	assert.NotNil(t, job.Bag)
	assert.NotNil(t, job.File)
	require.NotNil(t, job.Workflow)
	assert.NotNil(t, job.Workflow.StorageService)
	require.NotNil(t, job.Workflow.BagItProfile)

	// 11 is the number of required tags specified in the APTrust BagIt profile.
	// Our tests use testdata/profiles/aptrust_bagit_profile_2.0.json
	assert.Equal(t, 11, len(job.Workflow.BagItProfile.DefaultTagValues))
}
