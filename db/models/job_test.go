package models_test

/* NOTE: main_test.go contains the TestMain, setup, and teardown functions for this suite. */

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestJobGetId(t *testing.T) {
	job := FakeJob()
	assert.Equal(t, job.Id, job.GetId())
}

func TestJobTableName(t *testing.T) {
	job := FakeJob()
	assert.Equal(t, "jobs", job.TableName())
}

func TestJobValidate(t *testing.T) {
	job := FakeJob()
	assert.True(t, job.Validate())
	assert.NotNil(t, job.Errors())
	assert.Empty(t, job.Errors())
}

func TestJobErrors(t *testing.T) {
	job := FakeJob()
	assert.NotNil(t, job.Errors())
	assert.Empty(t, job.Errors())
}

func TestJobSave(t *testing.T) {
	// Save as insert
	job := FakeJob()
	job.Id = 0
	ok := job.Save(false)
	assert.True(t, ok)
	assert.NotEqual(t, 0, job.Id)
	assert.Empty(t, job.Errors())

	// Save as update
	id := job.Id
	job.Outcome = job.Outcome + "updated"
	ok = job.Save(false)
	assert.True(t, ok)
	assert.Equal(t, id, job.Id)
	assert.Empty(t, job.Errors())
}

func TestGetJob(t *testing.T) {
	// Save first
	job := FakeJob()
	job.Id = 0
	ok := job.Save(false)
	assert.True(t, ok)
	assert.NotEqual(t, 0, job.Id)

	// Now get
	retrievedJob, err := models.GetJob(job.Id)
	require.Nil(t, err)
	assert.Equal(t, job.Id, retrievedJob.Id)
	assert.Equal(t, job.BagId, retrievedJob.BagId)
	assert.Equal(t, job.FileId, retrievedJob.FileId)
	assert.Equal(t, job.WorkflowId, retrievedJob.WorkflowId)
	assert.Equal(t, job.WorkflowSnapshot, retrievedJob.WorkflowSnapshot)
	assert.Equal(t, job.CreatedAt, retrievedJob.CreatedAt)
	assert.Equal(t, job.ScheduledStartTime, retrievedJob.ScheduledStartTime)
	assert.Equal(t, job.StartedAt, retrievedJob.StartedAt)
	assert.Equal(t, job.FinishedAt, retrievedJob.FinishedAt)
	assert.Equal(t, job.Pid, retrievedJob.Pid)
	assert.Equal(t, job.Outcome, retrievedJob.Outcome)
	assert.Equal(t, job.CapturedOutput, retrievedJob.CapturedOutput)
	assert.Empty(t, job.Errors())
}

func TestGetJobs(t *testing.T) {
	// Delete jobs created by other tests
	_, err := models.ExecCommand("delete from jobs", nil)
	require.Nil(t, err)

	// Save some first
	for i := 0; i < 10; i++ {
		job := FakeJob()
		job.Id = 0
		if i%2 == 0 {
			job.Outcome = fmt.Sprintf("Even %d", i)
		} else {
			job.Outcome = fmt.Sprintf("Odd %d", i)
		}
		if i%3 == 0 {
			job.CapturedOutput = ""
		}
		ok := job.Save(false)
		assert.True(t, ok)
		assert.NotEqual(t, 0, job.Id)
	}

	// Now select
	// Jobs 3 and 9 have Odd name and empty outcome
	where := "outcome like ? and captured_output = ?"
	values := []interface{}{
		"Odd%",
		"",
	}
	jobs, err := models.GetJobs(where, values)
	require.Nil(t, err)
	require.NotNil(t, jobs)
	assert.Equal(t, 2, len(jobs))

	// Should get ten jobs
	where = ""
	values = []interface{}{}
	jobs, err = models.GetJobs(where, values)
	require.Nil(t, err)
	require.NotNil(t, jobs)
	assert.Equal(t, 10, len(jobs))

	// Should also get ten jobs
	where = "outcome like 'Even %' or outcome like 'Odd%'"
	values = make([]interface{}, 0)
	jobs, err = models.GetJobs(where, values)
	require.Nil(t, err)
	require.NotNil(t, jobs)
	assert.Equal(t, 10, len(jobs))

	// Should get jobs
	where = "outcome like :outcome"
	values = []interface{}{
		"Even%",
	}
	jobs, err = models.GetJobs(where, values)
	require.Nil(t, err)
	require.NotNil(t, jobs)
	assert.Equal(t, 5, len(jobs))
}

func TestJobWorkflow(t *testing.T) {
	emptyId := int64(0)
	nonEmptyId := int64(101010)

	job := FakeJob()
	job.WorkflowId = &nonEmptyId

	// Should get error for bad workflow id
	workflow, err := job.Workflow()
	assert.Nil(t, workflow)
	assert.NotNil(t, err)

	job.WorkflowId = &emptyId
	workflow, err = job.Workflow()
	assert.Nil(t, workflow)
	assert.Nil(t, err)

	// Create a workflow record
	workflow = FakeWorkflow()
	workflow.Id = 0
	ok := workflow.Save(true)
	assert.True(t, ok)
	assert.NotEqual(t, 0, workflow.Id)

	// Assign that workflow to this job...
	job.WorkflowId = &workflow.Id

	// ...and now we should get a record.
	workflow, err = job.Workflow()
	assert.Nil(t, err)
	require.NotNil(t, workflow)
	assert.NotEmpty(t, workflow.Name)
	assert.NotEmpty(t, workflow.Description)
}

func TestJobBag(t *testing.T) {
	emptyId := int64(0)
	nonEmptyId := int64(101010)

	job := FakeJob()
	job.BagId = &nonEmptyId

	// Should get error for bad bag id
	bag, err := job.Bag()
	assert.Nil(t, bag)
	assert.NotNil(t, err)

	job.BagId = &emptyId
	bag, err = job.Bag()
	assert.Nil(t, bag)
	assert.Nil(t, err)

	// Create a bag record
	bag = FakeBag()
	bag.Id = 0
	ok := bag.Save(true)
	assert.True(t, ok)
	assert.NotEqual(t, 0, bag.Id)

	// Assign that bag to this job...
	job.BagId = &bag.Id

	// ...and now we should get a record.
	bag, err = job.Bag()
	assert.Nil(t, err)
	require.NotNil(t, bag)
	assert.NotEmpty(t, bag.Name)
	assert.NotEmpty(t, bag.Size)
}

func TestJobFile(t *testing.T) {
	emptyId := int64(0)
	nonEmptyId := int64(101010)

	job := FakeJob()
	job.FileId = &nonEmptyId

	// Should get error for bad file id
	file, err := job.File()
	assert.Nil(t, file)
	assert.NotNil(t, err)

	job.FileId = &emptyId
	file, err = job.File()
	assert.Nil(t, file)
	assert.Nil(t, err)

	// Create a file record
	file = FakeFile()
	file.Id = 0
	ok := file.Save(true)
	assert.True(t, ok)
	assert.NotEqual(t, 0, file.Id)

	// Assign that file to this job...
	job.FileId = &file.Id

	// ...and now we should get a record.
	file, err = job.File()
	assert.Nil(t, err)
	require.NotNil(t, file)
	assert.NotEmpty(t, file.Name)
	assert.NotEmpty(t, file.Size)
}
