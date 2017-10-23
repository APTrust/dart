package models_test

import (
	"github.com/APTrust/easy-store/db/models"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestWorkflowLoad(t *testing.T) {
	db, job, err := setupJobTest()
	if db != nil {
		defer db.Close()
	}
	require.Nil(t, err)
	assert.NotNil(t, job)
	workflow, err := models.WorkflowLoad(db, job.WorkflowID)
	assert.Nil(t, err)
	require.NotNil(t, workflow)
	assert.Equal(t, job.WorkflowID, workflow.ID)
}

func TestWorkflowLoadWithRelations(t *testing.T) {
	db, job, err := setupJobTest()
	if db != nil {
		defer db.Close()
	}
	require.Nil(t, err)
	assert.NotNil(t, job)
	workflow, err := models.WorkflowLoadWithRelations(db, job.WorkflowID)
	assert.Nil(t, err)
	require.NotNil(t, workflow)
	assert.Equal(t, job.WorkflowID, workflow.ID)
	assert.NotNil(t, workflow.StorageService)
	require.NotNil(t, workflow.BagItProfile)

	// 11 required tags specified in the APTrust BagIt profile
	// at testdata/profiles/aptrust_bagit_profile_2.0.json
	assert.Equal(t, 11, len(workflow.BagItProfile.DefaultTagValues))
}
