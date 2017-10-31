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

func initWorkflowsTest() (*gorm.DB, []*models.Workflow, error) {
	workflows := make([]*models.Workflow, 3)
	db, err := InitTestDB()
	if err != nil {
		return nil, workflows, err
	}
	for i := 0; i < 3; i++ {
		p, err := CreateFakeWorkflowWithRelations(db)
		if err != nil {
			return nil, workflows, err
		}
		workflows[i] = p
	}
	return db, workflows, err
}

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

func TestWorkflowOptions(t *testing.T) {
	db, workflows, err := initWorkflowsTest()
	if db != nil {
		defer db.Close()
	}
	require.Nil(t, err)
	assert.NotNil(t, db)
	choices := models.WorkflowOptions(db)
	require.NotEmpty(t, choices)
	require.Equal(t, 4, len(choices))
	assert.Equal(t, "", choices[0].Value)
	assert.Equal(t, "", choices[0].Label)
	assert.Equal(t, fmt.Sprintf("%d", workflows[0].ID), choices[1].Value)
	assert.Equal(t, workflows[0].Name, choices[1].Label)
	assert.Equal(t, fmt.Sprintf("%d", workflows[1].ID), choices[2].Value)
	assert.Equal(t, workflows[1].Name, choices[2].Label)
	assert.Equal(t, fmt.Sprintf("%d", workflows[2].ID), choices[3].Value)
	assert.Equal(t, workflows[2].Name, choices[3].Label)
}
