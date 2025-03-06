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

func TestUploadJobNew(t *testing.T) {
	defer core.ClearDartTable()

	testStorageServices := loadTestStorageServices(t)

	expected := []string{
		"jumpMenu",
		"showHiddenFiles",
		"file-browser-item",
		"dropZone",
		"fileTotals",
		"attachDragAndDropEvents",
	}
	DoGetTestWithRedirect(t, "/upload_jobs/new", "/upload_jobs/files/", expected)

	uploadJob := core.ObjList(constants.TypeUploadJob, "obj_name", 1, 0).UploadJob()
	require.NotNil(t, uploadJob)

	testUploadJobShowFiles(t, uploadJob.ID)
	testUploadJobAddFile(t, uploadJob.ID)
	testUploadJobDeleteFile(t, uploadJob.ID)
	testUploadJobShowTargets(t, uploadJob.ID, testStorageServices)
	testUploadJobSaveTargets(t, uploadJob.ID, testStorageServices)
	testUploadJobReview(t, uploadJob.ID, testStorageServices)
	testUploadJobRun(t, uploadJob.ID)
}

func testUploadJobShowFiles(t *testing.T, id string) {
	expected := []string{
		"jumpMenu",
		"showHiddenFiles",
		"file-browser-item",
		"dropZone",
		"fileTotals",
		"attachDragAndDropEvents",
	}
	DoSimpleGetTest(t, fmt.Sprintf("/upload_jobs/files/%s", id), expected)
}

// Add three files to the job
func testUploadJobAddFile(t *testing.T, id string) {
	file1 := filepath.Join(util.PathToTestData(), "bags", "example.edu.sample_good.tar")
	file2 := filepath.Join(util.PathToTestData(), "bags", "example.edu.tagsample_good.tar")
	file3 := filepath.Join(util.PathToTestData(), "bags", "example.edu.sample_good.zip")
	files := []string{file1, file2, file3}

	for _, file := range files {
		params := url.Values{}
		params.Add("fullPath", file)
		settings := PostTestSettings{
			EndpointUrl:              fmt.Sprintf("/upload_jobs/add_file/%s", id),
			Params:                   params,
			ExpectedResponseCode:     http.StatusFound,
			ExpectedRedirectLocation: fmt.Sprintf("/upload_jobs/files/%s?directory=", id),
			ExpectedContent:          []string{file},
		}
		DoPostTestWithRedirect(t, settings)
	}
}

// Delete the third file. Make sure the other two remain.
func testUploadJobDeleteFile(t *testing.T, id string) {
	file1 := filepath.Join(util.PathToTestData(), "bags", "example.edu.sample_good.tar")
	file2 := filepath.Join(util.PathToTestData(), "bags", "example.edu.tagsample_good.tar")
	file3 := filepath.Join(util.PathToTestData(), "bags", "example.edu.sample_good.zip")

	params := url.Values{}
	params.Add("fullPath", file3)
	settings := PostTestSettings{
		EndpointUrl:              fmt.Sprintf("/upload_jobs/delete_file/%s", id),
		Params:                   params,
		ExpectedResponseCode:     http.StatusFound,
		ExpectedRedirectLocation: fmt.Sprintf("/upload_jobs/files/%s?directory=", id),
		ExpectedContent:          []string{file1, file2},
	}
	DoPostTestWithRedirect(t, settings)
}

func testUploadJobShowTargets(t *testing.T, id string, testStorageServices []*core.StorageService) {
	require.NotEmpty(t, testStorageServices)
	expected := make([]string, 0)
	for _, ss := range testStorageServices {
		expected = append(expected, ss.Name)
		expected = append(expected, ss.ID)
	}
	DoSimpleGetTest(t, fmt.Sprintf("/upload_jobs/targets/%s", id), expected)
}

func testUploadJobSaveTargets(t *testing.T, id string, testStorageServices []*core.StorageService) {
	require.NotEmpty(t, testStorageServices)
	expected := make([]string, 0)
	params := url.Values{}

	for _, ss := range testStorageServices {
		// Save both storage services to our upload job.
		params.Add("StorageServiceIDs", ss.ID)
		// On the review page, we should see the names of both.
		expected = append(expected, ss.Name)
	}
	settings := PostTestSettings{
		EndpointUrl:              fmt.Sprintf("/upload_jobs/targets/%s", id),
		Params:                   params,
		ExpectedResponseCode:     http.StatusFound,
		ExpectedRedirectLocation: fmt.Sprintf("/upload_jobs/review/%s", id),
		ExpectedContent:          expected,
	}
	DoPostTestWithRedirect(t, settings)
}

func testUploadJobReview(t *testing.T, id string, testStorageServices []*core.StorageService) {
	require.NotEmpty(t, testStorageServices)

	// The review page should show these two files that we
	// added above. These are the files to be uploaded.
	expected := []string{
		filepath.Join(util.PathToTestData(), "bags", "example.edu.sample_good.tar"),
		filepath.Join(util.PathToTestData(), "bags", "example.edu.tagsample_good.tar"),
	}
	// The page should also show the names of the storage services
	// to which we are uploading materials.
	for _, ss := range testStorageServices {
		expected = append(expected, ss.Name)
	}
	DoSimpleGetTest(t, fmt.Sprintf("/upload_jobs/review/%s", id), expected)

}

// NOTE: This test assumes that local Minio and SFTP servers are running.
//
// If you run the full test suite using `./scripts/run.rb tests`, the
// script will start those servers for you.
//
// If you want to run this as a one-off test, first start the Minio and SFTP
// servers using `./scripts/run.rb dart`, then run the tests in this file.
func testUploadJobRun(t *testing.T, id string) {
	// This requires use of StreamRecorder to capture server-sent events.
	recorder := NewStreamRecorder()
	req, _ := http.NewRequest(http.MethodGet, fmt.Sprintf("/upload_jobs/run/%s", id), nil)
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
	assert.True(t, jobResult.Succeeded)

	// The controller should have saved the completed uploadJob in the DB.
	// If it did, the uploadJob result will show that all items completed.
	uploadJob := core.ObjFind(id).UploadJob()
	require.NotNil(t, uploadJob)
}

func loadTestStorageServices(t *testing.T) []*core.StorageService {
	localMinioService, err := core.LoadStorageServiceFixture("storage_service_local_minio.json")
	require.Nil(t, err)
	require.NotNil(t, localMinioService)

	localSFTPService, err := core.LoadStorageServiceFixture("storage_service_local_sftp.json")
	require.Nil(t, err)
	require.NotNil(t, localSFTPService)

	require.NoError(t, core.ObjSave(localMinioService))
	require.NoError(t, core.ObjSave(localSFTPService))

	return []*core.StorageService{localMinioService, localSFTPService}
}
