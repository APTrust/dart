package controllers_test

import (
	"fmt"
	"net/http"
	"path/filepath"
	"runtime"
	"testing"
	"time"

	"github.com/APTrust/dart-runner/core"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestJobRunShow(t *testing.T) {
	defer core.ClearDartTable()
	job := loadTestJob(t)
	require.NoError(t, core.ObjSave(job))
	require.NoError(t, core.ObjSave(job.BagItProfile))
	outputPath := job.PackageOp.OutputPath

	// Windows :(
	if runtime.GOOS == "windows" {
		outputPath = "\\" + filepath.Base(outputPath)
	}

	expectedContent := []string{
		"Package Name",
		"BagIt Profile",
		"Payload Summary",
		"Files to Package",
		"Upload To",
		job.BagItProfile.Name,
		job.Name(),
		job.ID,
		job.PackageOp.PackageName,
		outputPath,
		"Local Minio",     // upload target
		"Payload Summary", // file count, dir count and bytes will change as project changes
		"Directories",
		"Files",
		"MB",
		"Back",
		"Run Job",
		"Create Workflow",
	}
	// expectedContent = append(expectedContent, job.PackageOp.SourceFiles...)
	pageUrl := fmt.Sprintf("/jobs/summary/%s", job.ID)
	DoSimpleGetTest(t, pageUrl, expectedContent)
}

// See:
// https://github.com/r3labs/sse or using a
// https://blog.lucaskatayama.com/posts/go/2020/08/sse-with-gin/.

func TestJobRunExecute(t *testing.T) {
	// This requires use of StreamRecorder to capture server-sent events.
	// This also requires a local running Minio server to receive the
	// upload portion of the job. If you run tests using
	// `./scripts/run.rb tests`, the script will start the server for you.
	// If you're running this test by itself or inside VS Code,
	// be sure the start the Minio server first. See scripts/run.rb.
	defer core.ClearDartTable()
	job := loadTestJob(t)
	require.NoError(t, core.ObjSave(job))

	recorder := NewStreamRecorder()
	req, _ := http.NewRequest(http.MethodGet, fmt.Sprintf("/jobs/run/%s", job.ID), nil)
	dartServer.ServeHTTP(recorder, req)

	for !recorder.Flushed {
		time.Sleep(250 * time.Millisecond)
	}

	assert.Equal(t, http.StatusOK, recorder.Code)
	html := recorder.Body.String()
	assert.NotEmpty(t, html)
	assert.True(t, recorder.EventCount > 100)
	assert.Equal(t, "Job completed with exit code 0 (success)", recorder.LastEvent.Message)

	// Test the job result that came through in the SSE event stream.
	jobResult := recorder.ResultEvent.JobResult
	require.NotNil(t, jobResult)
	testPostRunJobResult(t, jobResult, "Result from HTTP stream recorder")

	// The controller should have saved the completed job in the DB.
	// If it did, the job result will show that all items completed.
	job = core.ObjFind(job.ID).Job()
	require.NotNil(t, job)
	jobResult = core.NewJobResult(job)
	testPostRunJobResult(t, jobResult, "Result from database")
}

func testPostRunJobResult(t *testing.T, jobResult *core.JobResult, whence string) {
	// Check some basic details...
	assert.Equal(t, "APTrust-S3-Bag-01.tar", jobResult.JobName, whence)
	assert.True(t, jobResult.PayloadByteCount > 15000000, jobResult.PayloadByteCount, whence)
	assert.True(t, jobResult.PayloadFileCount > int64(1000), jobResult.PayloadFileCount, whence)

	// Make sure job definition was valid.
	assert.Empty(t, jobResult.ValidationErrors, whence)

	// Make sure the packaging step (bagging) was attempted and did succeed.
	assert.True(t, jobResult.PackageResult.WasAttempted(), whence)
	assert.True(t, jobResult.PackageResult.Succeeded(), whence)
	assert.Empty(t, jobResult.PackageResult.Errors, whence)

	// Make sure the job validated the bag and found no errors.
	require.NotEmpty(t, jobResult.ValidationResults)
	assert.True(t, jobResult.ValidationResults[0].WasAttempted(), whence)
	assert.True(t, jobResult.ValidationResults[0].Succeeded(), whence)
	assert.Empty(t, jobResult.ValidationResults[0].Errors, whence)

	// Make sure all upload operations were attempted and succeeded.
	for _, uploadResult := range jobResult.UploadResults {
		assert.True(t, uploadResult.WasAttempted(), whence)
		assert.True(t, uploadResult.Succeeded(), whence)
		assert.Empty(t, uploadResult.Errors, whence)
	}
}
