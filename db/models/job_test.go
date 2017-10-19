package models_test

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"testing"
)

func setupJobTest() (*gorm.DB, uint, error) {
	db, err := gorm.Open("sqlite3", ":memory:")
	if err != nil {
		return nil, uint(0), err
	}
	err = db.AutoMigrate(
		&models.AppSetting{},
		&models.Bag{},
		&models.BagItProfile{},
		&models.DefaultTagValue{},
		&models.File{},
		&models.Job{},
		&models.StorageService{},
		&models.Tag{},
		&models.Workflow{},
	).Error

	// Create Job, Workflow, BagItProfile, StorageService
	// TODO: Move all this into a factory helper.
	ss := &models.StorageService{
		Name:           "SS1",
		Protocol:       "s3",
		URL:            "https://www.example.com",
		BucketOrFolder: "example",
		LoginName:      "OliveOyl",
		LoginPassword:  "spinach",
	}
	err = db.Save(ss).Error
	if err != nil {
		return db, uint(0), err
	}
	profile := &models.BagItProfile{
		Name: "BP1",
	}
	err = db.Save(profile).Error
	if err != nil {
		return db, uint(0), err
	}
	for i := 0; i < 5; i++ {
		dt := &models.DefaultTagValue{
			BagItProfileID: profile.ID,
			TagFile:        "bag-info.txt",
			TagName:        fmt.Sprintf("tag-%d", i),
			TagValue:       fmt.Sprintf("value-%d", i),
		}
		err = db.Save(dt).Error
		if err != nil {
			return db, uint(0), err
		}
	}
	workflow := &models.Workflow{
		Name:                "WF1",
		SerializationFormat: "tar",
		BagItProfileID:      profile.ID,
		StorageServiceID:    ss.ID,
	}
	err = db.Save(workflow).Error
	if err != nil {
		return db, uint(0), err
	}
	bag := &models.Bag{
		Name: "Bag1",
		Size: int64(8888),
	}
	err = db.Save(bag).Error
	if err != nil {
		return db, uint(0), err
	}
	for i := 0; i < 5; i++ {
		f := &models.File{
			BagID: bag.ID,
			Name:  fmt.Sprintf("file-%d", i),
			Size:  int64(i * 100),
		}
		err = db.Save(f).Error
		if err != nil {
			return db, uint(0), err
		}
	}
	file := &models.File{
		Name: "Homer Simpson",
	}
	err = db.Save(file).Error
	if err != nil {
		return db, uint(0), err
	}
	// In reality, a job will have a bag or a file,
	// but not both.
	job := &models.Job{
		BagID:      bag.ID,
		FileID:     file.ID,
		WorkflowID: workflow.ID,
	}
	err = db.Save(job).Error
	if err != nil {
		return db, uint(0), err
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
	assert.Equal(t, 5, len(job.Workflow.BagItProfile.DefaultTagValues))
}
