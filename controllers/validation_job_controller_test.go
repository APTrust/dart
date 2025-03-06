package controllers_test

import (
	"fmt"
	"net/http"
	"net/url"
	"path/filepath"
	"testing"
	"time"

	"github.com/APTrust/dart-runner/constants"
	"github.com/APTrust/dart-runner/core"
	"github.com/APTrust/dart-runner/util"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestValidationJobNew(t *testing.T) {
	defer core.ClearDartTable()

	// This loads the APTrust, BTR and Empty profiles
	saveTestProfiles(t)

	expected := []string{
		"jumpMenu",
		"showHiddenFiles",
		"file-browser-item",
		"dropZone",
		"fileTotals",
		"attachDragAndDropEvents",
	}
	DoGetTestWithRedirect(t, "/validation_jobs/new", "/validation_jobs/files/", expected)

	valJob := core.ObjList(constants.TypeValidationJob, "obj_name", 1, 0).ValidationJob()
	require.NotNil(t, valJob)

	testValidationJobShowFiles(t, valJob.ID)
	testValidationJobAddFile(t, valJob.ID)
	testValidationJobDeleteFile(t, valJob.ID)
	testValidationJobShowProfiles(t, valJob.ID)
	testValidationJobSaveProfile(t, valJob.ID)
	testValidationJobReview(t, valJob.ID)
	testValidationJobRun(t, valJob.ID)
}

func testValidationJobShowFiles(t *testing.T, id string) {
	expected := []string{
		"jumpMenu",
		"showHiddenFiles",
		"file-browser-item",
		"dropZone",
		"fileTotals",
		"attachDragAndDropEvents",
	}
	DoSimpleGetTest(t, fmt.Sprintf("/validation_jobs/files/%s", id), expected)
}

// Add two files to the job
func testValidationJobAddFile(t *testing.T, id string) {
	file1 := filepath.Join(util.PathToTestData(), "bags", "example.edu.sample_good.tar")
	file2 := filepath.Join(util.PathToTestData(), "bags", "example.edu.tagsample_good.tar")
	files := []string{file1, file2}

	for _, file := range files {
		params := url.Values{}
		params.Add("fullPath", file)
		settings := PostTestSettings{
			EndpointUrl:              fmt.Sprintf("/validation_jobs/add_file/%s", id),
			Params:                   params,
			ExpectedResponseCode:     http.StatusFound,
			ExpectedRedirectLocation: fmt.Sprintf("/validation_jobs/files/%s?directory=", id),
			ExpectedContent:          []string{file},
		}
		DoPostTestWithRedirect(t, settings)
	}
}

// Delete the second file. Make sure the first remains.
func testValidationJobDeleteFile(t *testing.T, id string) {
	file1 := filepath.Join(util.PathToTestData(), "bags", "example.edu.sample_good.tar")
	file2 := filepath.Join(util.PathToTestData(), "bags", "example.edu.tagsample_good.tar")

	params := url.Values{}
	params.Add("fullPath", file2)
	settings := PostTestSettings{
		EndpointUrl:              fmt.Sprintf("/validation_jobs/delete_file/%s", id),
		Params:                   params,
		ExpectedResponseCode:     http.StatusFound,
		ExpectedRedirectLocation: fmt.Sprintf("/validation_jobs/files/%s?directory=", id),
		ExpectedContent:          []string{file1},
	}
	DoPostTestWithRedirect(t, settings)
}

func testValidationJobShowProfiles(t *testing.T, id string) {
	expected := []string{
		"APTrust",
		"BTR SHA-512",
		"Empty Profile",
	}
	DoSimpleGetTest(t, fmt.Sprintf("/validation_jobs/profiles/%s", id), expected)
}

func testValidationJobSaveProfile(t *testing.T, id string) {
	expected := []string{
		"APTrust",                     // name of BagIt profile
		"example.edu.sample_good.tar", // name of bag to validate
	}
	params := url.Values{}
	params.Add("BagItProfileID", constants.ProfileIDAPTrust)
	settings := PostTestSettings{
		EndpointUrl:              fmt.Sprintf("/validation_jobs/profiles/%s", id),
		Params:                   params,
		ExpectedResponseCode:     http.StatusFound,
		ExpectedRedirectLocation: fmt.Sprintf("/validation_jobs/review/%s", id),
		ExpectedContent:          expected,
	}
	DoPostTestWithRedirect(t, settings)
}

func testValidationJobReview(t *testing.T, id string) {
	expected := []string{
		"APTrust",                     // name of BagIt profile
		"example.edu.sample_good.tar", // name of bag to validate
	}
	DoSimpleGetTest(t, fmt.Sprintf("/validation_jobs/review/%s", id), expected)

}

func testValidationJobRun(t *testing.T, id string) {
	// This requires use of StreamRecorder to capture server-sent events.
	recorder := NewStreamRecorder()
	req, _ := http.NewRequest(http.MethodGet, fmt.Sprintf("/validation_jobs/run/%s", id), nil)
	dartServer.ServeHTTP(recorder, req)

	// This should wrap up in <250 ms, but we'll give it
	// as long as it needs.
	for !recorder.Flushed {
		time.Sleep(250 * time.Millisecond)
	}

	assert.Equal(t, http.StatusOK, recorder.Code)
	html := recorder.Body.String()
	assert.NotEmpty(t, html)
	assert.True(t, recorder.EventCount > 10)
	assert.Equal(t, "Job completed with exit code 0 (success)", recorder.LastEvent.Message)

	// Test the job result that came through in the SSE event stream.
	jobResult := recorder.ResultEvent.JobResult
	require.NotNil(t, jobResult)
	assert.Equal(t, "Bag is valid.", jobResult.ValidationResults[0].Info)

	// The controller should have saved the completed valJob in the DB.
	// If it did, the valJob result will show that all items completed.
	valJob := core.ObjFind(id).ValidationJob()
	require.NotNil(t, valJob)
}
