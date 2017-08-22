package models_test

/* NOTE: main_test.go contains the TestMain, setup, and teardown functions for this suite. */

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestWorkflowGetId(t *testing.T) {
	workflow := FakeWorkflow()
	assert.Equal(t, workflow.Id, workflow.GetId())
}

func TestWorkflowTableName(t *testing.T) {
	workflow := FakeWorkflow()
	assert.Equal(t, "workflows", workflow.TableName())
}

func TestWorkflowValidate(t *testing.T) {
	workflow := FakeWorkflow()
	assert.True(t, workflow.Validate())
	assert.NotNil(t, workflow.Errors())
	assert.Empty(t, workflow.Errors())
}

func TestWorkflowErrors(t *testing.T) {
	workflow := FakeWorkflow()
	assert.NotNil(t, workflow.Errors())
	assert.Empty(t, workflow.Errors())
}

func TestWorkflowSave(t *testing.T) {
	// Save as insert
	workflow := FakeWorkflow()
	workflow.Id = 0
	ok := workflow.Save(false)
	assert.True(t, ok)
	assert.NotEqual(t, 0, workflow.Id)
	assert.Empty(t, workflow.Errors())

	// Save as update
	id := workflow.Id
	workflow.Name = workflow.Name + "updated"
	ok = workflow.Save(false)
	assert.True(t, ok)
	assert.Equal(t, id, workflow.Id)
	assert.Empty(t, workflow.Errors())
}

func TestGetWorkflow(t *testing.T) {
	// Save first
	workflow := FakeWorkflow()
	workflow.Id = 0
	ok := workflow.Save(false)
	assert.True(t, ok)
	assert.NotEqual(t, 0, workflow.Id)

	// Now get
	retrievedWorkflow, err := models.GetWorkflow(workflow.Id)
	require.Nil(t, err)
	assert.Equal(t, workflow.Id, retrievedWorkflow.Id)
	assert.Equal(t, workflow.Name, retrievedWorkflow.Name)
	assert.Equal(t, workflow.Description, retrievedWorkflow.Description)
	assert.Equal(t, workflow.ProfileId, retrievedWorkflow.ProfileId)
	assert.Equal(t, workflow.StorageServiceId, retrievedWorkflow.StorageServiceId)
	assert.Empty(t, workflow.Errors())
}

func TestGetWorkflows(t *testing.T) {
	// Delete workflows created by other tests
	_, err := models.ExecCommand("delete from workflows", nil)
	require.Nil(t, err)

	// Save some first
	for i := 0; i < 10; i++ {
		workflow := FakeWorkflow()
		workflow.Id = 0
		if i%2 == 0 {
			workflow.Name = fmt.Sprintf("Even %d", i)
		} else {
			workflow.Name = fmt.Sprintf("Odd %d", i)
		}
		if i%3 == 0 {
			workflow.Description = ""
		}
		ok := workflow.Save(false)
		assert.True(t, ok)
		assert.NotEqual(t, 0, workflow.Id)
	}

	// Now select
	// Workflows 3 and 9 have Odd name and empty description
	where := "name like ? and description = ?"
	values := []interface{}{
		"Odd%",
		"",
	}
	workflows, err := models.GetWorkflows(where, values)
	require.Nil(t, err)
	require.NotNil(t, workflows)
	assert.Equal(t, 2, len(workflows))

	// Should get ten workflows
	where = ""
	values = []interface{}{}
	workflows, err = models.GetWorkflows(where, values)
	require.Nil(t, err)
	require.NotNil(t, workflows)
	assert.Equal(t, 10, len(workflows))

	// Should also get ten workflows
	where = "name like 'Even %' or name like 'Odd%'"
	values = make([]interface{}, 0)
	workflows, err = models.GetWorkflows(where, values)
	require.Nil(t, err)
	require.NotNil(t, workflows)
	assert.Equal(t, 10, len(workflows))

	// Should get workflows
	where = "name like :name"
	values = []interface{}{
		"Even%",
	}
	workflows, err = models.GetWorkflows(where, values)
	require.Nil(t, err)
	require.NotNil(t, workflows)
	assert.Equal(t, 5, len(workflows))
}
