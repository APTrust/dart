package controllers_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/APTrust/dart-runner/constants"
	"github.com/APTrust/dart-runner/core"
	"github.com/APTrust/dart-runner/util"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestWorkflowNew(t *testing.T) {
	defer core.ClearDartTable()

	// Create some storage services to appear on the workflow form.
	services := CreateStorageServices(t, 3)

	// Confirm that there are currently zero workflows in the DB.
	result := core.ObjList(constants.TypeWorkflow, "obj_name", 10, 0)
	require.Nil(t, result.Error)
	assert.Empty(t, result.Workflows)

	// Get the new workflow page and make sure it includes expected items.
	expected := []string{
		"New Workflow",
		"PackageFormat",
		"BagIt",
		services[0].ID,
		services[0].Name,
		services[1].ID,
		services[1].Name,
		services[2].ID,
		services[2].Name,
	}
	DoSimpleGetTest(t, "/workflows/new", expected)

	// Make sure the new workflow exists in the DB.
	// The WorkflowNew endpoint should create and
	// save this before showing the form.
	result = core.ObjList(constants.TypeWorkflow, "obj_name", 10, 0)
	require.Nil(t, result.Error)
	assert.Equal(t, 1, len(result.Workflows))
	assert.Equal(t, "New Workflow", result.Workflow().Name)
}

func TestWorkflowCreateEditDelete(t *testing.T) {
	defer core.ClearDartTable()
	workflow := testWorkflowCreateFromJob(t)
	testWorkflowEdit(t, workflow)
	testWorkflowDelete(t, workflow)
}

func testWorkflowCreateFromJob(t *testing.T) *core.Workflow {
	// Save a job and its associated records, so we can
	// create a workflow from it.
	job := loadTestJob(t)
	assert.NoError(t, core.ObjSave(job.BagItProfile))
	for _, op := range job.UploadOps {
		assert.NoError(t, core.ObjSave(op.StorageService))
	}
	require.NoError(t, core.ObjSave(job))

	// Post to the endpoint and make sure we get the
	// expected redirect. Note that this endpoint is called
	// via AJAX from the front-end, so it returns JSON data
	// if it succeeds, and the front-end JS follows the
	// location URL in the JSON.
	endpointUrl := fmt.Sprintf("/workflows/from_job/%s", job.ID)
	params := url.Values{}
	w := httptest.NewRecorder()
	req, err := NewPostRequest(endpointUrl, params)
	require.Nil(t, err)
	dartServer.ServeHTTP(w, req)
	assert.Equal(t, http.StatusCreated, w.Code)

	responseData := make(map[string]string)
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &responseData))
	assert.True(t, strings.HasPrefix(responseData["location"], "/workflows/edit/"))

	// Now let's get the redirect URL and make sure it has
	// the form to edit this newly created workflow.
	expected := []string{
		"New Workflow",
		"PackageFormat",
		"BagIt",
		job.UploadOps[0].StorageService.ID,
		job.UploadOps[0].StorageService.Name,
	}
	DoSimpleGetTest(t, responseData["location"], expected)

	// Finally, make sure the workflow was saved to the DB.
	parts := strings.Split(responseData["location"], "/")
	uuid := parts[len(parts)-1]
	workflow := core.ObjFind(uuid).Workflow()
	require.NotNil(t, workflow)

	return workflow
}

func testWorkflowEdit(t *testing.T, workflow *core.Workflow) {
	// Create some storage services to appear on the workflow form.
	services := CreateStorageServices(t, 3)

	// First test that the workflow edit form displays correctly.
	expected := []string{
		"Name",
		workflow.Name,
		"Description",
		workflow.Description,
		"PackageFormat",
		workflow.PackageFormat,
		"BagItProfileID",
		workflow.BagItProfile.ID,
		workflow.StorageServiceIDs[0],
		services[0].ID,
		services[1].ID,
		services[2].ID,
	}
	DoSimpleGetTest(t, fmt.Sprintf("/workflows/edit/%s", workflow.ID), expected)

	// Now let's submit the form and make sure changes are saved.
	originalSSID := workflow.StorageServiceIDs[0]

	alternateProfile := core.BagItProfileClone(workflow.BagItProfile)
	alternateProfile.Name = "Alternate Profile"
	alternateProfile.Description = "Description of alternate profile"
	require.NoError(t, core.ObjSave(alternateProfile))

	params := url.Values{}
	params.Set("Name", "Marge Simpson")
	params.Set("PackageFormat", constants.PackageFormatBagIt)
	params.Set("Description", "Tall, blue hair, scratchy voice.")
	params.Add("StorageServiceIDs", services[1].ID)
	params.Add("StorageServiceIDs", services[2].ID)
	params.Set("BagItProfileID", alternateProfile.ID)
	settings := PostTestSettings{
		EndpointUrl:              fmt.Sprintf("/workflows/edit/%s", workflow.ID),
		Params:                   params,
		ExpectedResponseCode:     http.StatusFound,
		ExpectedRedirectLocation: "/workflows",
	}
	DoSimplePostTest(t, settings)

	// Make sure the edits were saved
	result := core.ObjFind(workflow.ID)
	workflow = result.Workflow()
	require.Nil(t, result.Error)
	require.NotNil(t, workflow)
	assert.Equal(t, "Marge Simpson", workflow.Name)
	assert.Equal(t, constants.PackageFormatBagIt, workflow.PackageFormat)
	assert.Equal(t, "Tall, blue hair, scratchy voice.", workflow.Description)
	assert.Contains(t, workflow.StorageServiceIDs, services[1].ID)
	assert.Contains(t, workflow.StorageServiceIDs, services[2].ID)
	assert.NotContains(t, workflow.StorageServiceIDs, originalSSID)
	assert.Equal(t, alternateProfile.ID, workflow.BagItProfile.ID)
}

func testWorkflowDelete(t *testing.T, workflow *core.Workflow) {
	// Make sure workflow exists in DB before test.
	workflowBefore := core.ObjFind(workflow.ID).Workflow()
	require.NotNil(t, workflowBefore)

	settings := PostTestSettings{
		EndpointUrl:              fmt.Sprintf("/workflows/delete/%s", workflow.ID),
		Params:                   url.Values{},
		ExpectedResponseCode:     http.StatusFound,
		ExpectedRedirectLocation: "/workflows",
	}
	DoSimplePostTest(t, settings)

	// Make sure it was deleted
	// Make sure workflow exists in DB before test.
	workflowAfter := core.ObjFind(workflow.ID).Workflow()
	require.Nil(t, workflowAfter)
}

func TestWorkflowIndex(t *testing.T) {
	defer core.ClearDartTable()

	// Create five workflows
	job := loadTestJob(t)
	require.NoError(t, core.ObjSave(job.BagItProfile))
	for _, op := range job.UploadOps {
		require.NoError(t, core.ObjSave(op.StorageService))
	}
	workflows := make([]*core.Workflow, 5)
	for i := 0; i < 5; i++ {
		w, err := core.WorkFlowFromJob(job)
		require.Nil(t, err)
		w.Name = fmt.Sprintf("Workflow for list test %d", i+1)
		w.Description = fmt.Sprintf("Workflow description %d", i+1)
		require.NoError(t, core.ObjSave(w))
		workflows[i] = w
	}

	// Now make sure the list page shows them all
	expected := make([]string, 0)
	for _, w := range workflows {
		expected = append(expected, w.ID, w.Name, w.Description)
	}
	DoSimpleGetTest(t, "/workflows", expected)
}

func TestWorkflowExport(t *testing.T) {
	defer core.ClearDartTable()
	workflow := loadTestWorkflow(t)

	expected := []string{
		workflow.ID,
		workflow.Name,
		workflow.Description,
		workflow.BagItProfile.ID,
		workflow.BagItProfile.Description,
		workflow.StorageServices[0].ID,
		workflow.StorageServices[0].Name,
	}
	DoSimpleGetTest(t, fmt.Sprintf("/workflows/export/%s", workflow.ID), expected)
}

func TestWorkflowRun(t *testing.T) {
	defer core.ClearDartTable()
	workflow := loadTestWorkflow(t)

	// This is another AJAX endpoint that returns JSON
	// on success.
	endpointUrl := fmt.Sprintf("/workflows/run/%s", workflow.ID)
	params := url.Values{}
	w := httptest.NewRecorder()
	req, err := NewPostRequest(endpointUrl, params)
	require.Nil(t, err)
	dartServer.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	responseData := make(map[string]string)
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &responseData))
	assert.True(t, strings.HasPrefix(responseData["location"], "/jobs/files/"))

	// Make sure the system created a job from this workflow.
	parts := strings.Split(responseData["location"], "/")
	uuid := parts[len(parts)-1]
	job := core.ObjFind(uuid).Job()
	require.NotNil(t, job)
	assert.Equal(t, workflow.ID, job.WorkflowID)
}

// We test WorkflowBatch.Validate() extensively elsewhere.
// Instead of testing specific validation errors here, we
// just want to know that we get an error if the WorkflowBatch
// is invalid and no error if it's valid.
//
// In this case, the submission is missing the worklflow ID,
// and the CSV batch file points to some Root-Directory paths
// that don't exist.
func TestWorkflowBatchValidate_Invalid(t *testing.T) {
	defer core.ClearDartTable()
	workflow := loadTestWorkflow(t)
	require.NoError(t, core.ObjSave(workflow))

	csvFile := filepath.Join(util.PathToTestData(), "files", "postbuild_test_batch.csv")
	body := new(bytes.Buffer)
	writer := multipart.NewWriter(body)

	writer.WriteField("WorkflowID", workflow.ID)

	part, err := writer.CreateFormFile("CsvUpload", csvFile)
	assert.NoError(t, err)
	file, err := os.Open(csvFile)
	assert.NoError(t, err)

	_, err = io.Copy(part, file)
	assert.NoError(t, err)
	assert.NoError(t, writer.Close())

	// This submission is invalid because the CSV batch
	// file points to paths that don't exist in the Root-Directory field.
	req := httptest.NewRequest(http.MethodPost, "/workflows/batch/validate", body)
	req.Header.Add("Content-Type", writer.FormDataContentType())
	recorder := httptest.NewRecorder()
	dartServer.ServeHTTP(recorder, req)
	assert.Equal(t, http.StatusBadRequest, recorder.Code)
}

// Valid batch should return OK, plus a URL for running the batch.
func TestWorkflowBatchValidate_Valid(t *testing.T) {
	defer core.ClearDartTable()
	workflow := loadTestWorkflow(t)
	require.NoError(t, core.ObjSave(workflow))

	csvFile := filepath.Join(util.PathToTestData(), "files", "postbuild_test_batch.csv")

	// Make the relative paths absolute, and the validator should be
	// happy because this file contains a complete and valid set of tags.
	tmpFile := util.MakeTempCSVFileWithValidPaths(t, csvFile)
	defer func() { os.Remove(tmpFile) }()
	body := new(bytes.Buffer)
	writer := multipart.NewWriter(body)

	writer.WriteField("WorkflowID", workflow.ID)

	part, err := writer.CreateFormFile("CsvUpload", tmpFile)
	assert.NoError(t, err)
	file, err := os.Open(tmpFile)
	assert.NoError(t, err)

	_, err = io.Copy(part, file)
	assert.NoError(t, err)
	assert.NoError(t, writer.Close())

	// This submission is invalid because the CSV batch
	// file points to paths that don't exist in the Root-Directory field.
	req := httptest.NewRequest(http.MethodPost, "/workflows/batch/validate", body)
	req.Header.Add("Content-Type", writer.FormDataContentType())
	recorder := httptest.NewRecorder()
	dartServer.ServeHTTP(recorder, req)

	// We should get a 200/OK response, and the JSON should point
	// to /workflows/batch/run with the proper workflowID and
	// csv file path. Note that dart writes the CSV batch into a temp file.
	assert.Equal(t, http.StatusOK, recorder.Code)
	responseData := make(map[string]interface{})
	require.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &responseData))

	// Temp CSV file path will differ on Windows vs. Linux/Mac.
	expectedTempPath := filepath.Join(os.TempDir(), "temp_batch.csv")
	params := url.Values{}
	params.Set("PathToCSVFile", expectedTempPath)
	params.Set("WorkflowID", workflow.ID)
	expectedLocation := fmt.Sprintf("/workflows/batch/run?%s", params.Encode())
	actualLocation := responseData["location"].(string)
	assert.Equal(t, expectedLocation, actualLocation)

	testWorkflowRunBatch(t, actualLocation)
}

func testWorkflowRunBatch(t *testing.T, batchUrl string) {
	// Need to set this for things to work
	setting := core.NewAppSetting(constants.BaggingDirectory, os.TempDir())
	require.NoError(t, core.ObjSave(setting))

	recorder := NewStreamRecorder()
	req, _ := http.NewRequest(http.MethodGet, batchUrl, nil)
	dartServer.ServeHTTP(recorder, req)

	for !recorder.Flushed {
		time.Sleep(250 * time.Millisecond)
	}

	assert.Equal(t, http.StatusOK, recorder.Code)
	html := recorder.Body.String()
	assert.NotEmpty(t, html)
	assert.True(t, recorder.EventCount > 100)
	assert.Equal(t, "All jobs complete. Disconnect now.", recorder.LastEvent.Message)

	jobs := core.ObjList(constants.TypeJob, "obj_name", 10, 0).Jobs
	require.Equal(t, 3, len(jobs))

	for _, job := range jobs {
		jobResultArtifacts, err := core.ArtifactListByJobID(job.ID)
		require.Nil(t, err)
		assert.NotEmpty(t, jobResultArtifacts)
		foundJobResult := false
		for _, artifact := range jobResultArtifacts {
			if artifact.ItemType == constants.ItemTypeJobResult {
				foundJobResult = true
				break
			}
		}
		assert.True(t, foundJobResult)
	}
}

func loadTestWorkflow(t *testing.T) *core.Workflow {
	filepath := filepath.Join(util.PathToTestData(), "files", "postbuild_test_workflow.json")
	workflow, err := core.WorkflowFromJson(filepath)
	require.Nil(t, err)
	require.NotNil(t, workflow)
	require.NoError(t, core.ObjSave(workflow))
	require.NoError(t, core.ObjSave(workflow.BagItProfile))
	for _, ss := range workflow.StorageServices {
		require.NoError(t, core.ObjSave(ss))
	}
	return workflow
}
