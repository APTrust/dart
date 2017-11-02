package models_test

import (
	"github.com/APTrust/easy-store/db/models"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"testing"
)

func setupJobTest() (*gorm.DB, *models.Job, error) {
	db, err := InitTestDB()
	if err != nil {
		return nil, nil, err
	}
	job, err := CreateFakeJobWithRelations(db)
	if err != nil {
		return nil, nil, err
	}
	return db, job, err
}

func TestJobLoad(t *testing.T) {
	db, job, err := setupJobTest()
	if db != nil {
		defer db.Close()
	}
	require.Nil(t, err)
	assert.NotNil(t, job)
	jobFromDB, err := models.JobLoad(db, job.ID)
	assert.Nil(t, err)
	require.NotNil(t, jobFromDB)
	assert.Equal(t, jobFromDB.ID, job.ID)
}

func TestJobLoadWithRelations(t *testing.T) {
	db, job, err := setupJobTest()
	if db != nil {
		defer db.Close()
	}
	require.Nil(t, err)
	assert.NotNil(t, job)
	jobFromDB, err := models.JobLoadWithRelations(db, job.ID)
	assert.Nil(t, err)
	require.NotNil(t, jobFromDB)
	assert.Equal(t, jobFromDB.ID, job.ID)
	assert.NotNil(t, jobFromDB.Bag)
	assert.NotNil(t, jobFromDB.File)
	require.NotNil(t, jobFromDB.BagItProfile)

	// 11 is the number of required tags specified in the APTrust BagIt profile.
	// Our tests use testdata/profiles/aptrust_bagit_profile_2.0.json
	assert.Equal(t, 11, len(jobFromDB.BagItProfile.DefaultTagValues))
}
