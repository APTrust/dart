package controllers_test

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"github.com/APTrust/dart-runner/core"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestJobNew(t *testing.T) {
	defer core.ClearDartTable()

	// A call to /jobs/new should create a new job and
	// redirect to /jobs/files/:id where ;id is the
	// id of the newly created job.
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/jobs/new", nil)
	dartServer.ServeHTTP(w, req)

	// Make sure we got the expected redirect.
	assert.Equal(t, http.StatusFound, w.Code)

	// Make sure location is as expected
	location, err := w.Result().Location()
	require.Nil(t, err)
	loc := location.String()
	require.True(t, strings.HasPrefix(loc, "/jobs/files/"))

	// Now extract the job id from the URL and make
	// sure a new job with that id exists in the DB.
	parts := strings.Split(loc, "/")
	require.Equal(t, 4, len(parts))
	jobId := parts[3]
	result := core.ObjFind(jobId)
	require.Nil(t, result.Error)

	// New jobs get a default name like "Job of 2023-09-14T10:33:14-04:00"
	assert.True(t, strings.HasPrefix(result.Job().Name(), "Job of"))
}

func TestJobIndex(t *testing.T) {
	defer core.ClearDartTable()
	jobIds := make([]string, 5)
	jobNames := make([]string, 5)
	for i := 0; i < 5; i++ {
		job := loadTestJob(t)
		job.ID = uuid.NewString()
		job.PackageOp.PackageName = fmt.Sprintf("Job_%d.tar", i+1)
		require.Nil(t, core.ObjSave(job))
		jobIds[i] = job.ID
		jobNames[i] = job.Name()
	}
	expected := append(jobIds, jobNames...)
	DoSimpleGetTest(t, "/jobs", expected)
}

func TestJobDelete(t *testing.T) {
	defer core.ClearDartTable()
	job := loadTestJob(t)
	require.NoError(t, core.ObjSave(job))

	settings := PostTestSettings{
		EndpointUrl:              fmt.Sprintf("/jobs/delete/%s", job.ID),
		Params:                   url.Values{},
		ExpectedResponseCode:     http.StatusFound,
		ExpectedRedirectLocation: "/jobs",
	}
	DoSimplePostTest(t, settings)

	// Make sure it was deleted.
	result := core.ObjFind(job.ID)
	require.NotNil(t, result.Error)
	assert.Equal(t, "sql: no rows in result set", result.Error.Error())
}

func TestJobShowJson(t *testing.T) {
	defer core.ClearDartTable()
	job := loadTestJob(t)
	require.NoError(t, core.ObjSave(job))

	// Check for some basic elements that should be
	// present in the JSON data. We seem to have a
	// problem with Windows paths, so we're going to
	// look for just the file name on Windows.
	outputFileName := filepath.Base(job.PackageOp.OutputPath)
	if runtime.GOOS != "windows" {
		outputFileName = job.PackageOp.OutputPath
	}
	expected := []string{
		job.ID,
		job.BagItProfile.ID,
		outputFileName,
		job.ValidationOp.Result.Provider,
		job.UploadOps[0].StorageService.ID,
	}

	DoSimpleGetTest(t, fmt.Sprintf("/jobs/show_json/%s", job.ID), expected)
}
