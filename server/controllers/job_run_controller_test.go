package controllers_test

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
	"testing"
	"time"

	"github.com/APTrust/dart-runner/constants"
	"github.com/APTrust/dart-runner/core"
	"github.com/APTrust/dart-runner/util"
	"github.com/APTrust/dart/v3/server/controllers"
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

func TestJobRunShowHasStaleBagFlag(t *testing.T) {
	defer core.ClearDartTable()
	job := loadTestJob(t)
	require.NoError(t, core.ObjSave(job))
	require.NoError(t, core.ObjSave(job.BagItProfile))

	job.PackageOp.BagItSerialization = constants.SerialFormatTar
	job.PackageOp.OutputPath = "/path/does/not/exist/99887rand"
	err := core.ObjSave(job)
	require.Nil(t, err)

	// Output path should not exist
	expectedContent := []string{
		"var staleBagExists =  false",
	}

	pageUrl := fmt.Sprintf("/jobs/summary/%s", job.ID)
	DoSimpleGetTest(t, pageUrl, expectedContent)

	// Path exists, but serializion is tar, so
	// staleBagExists should be false
	job.PackageOp.OutputPath = util.PathToTestData()
	err = core.ObjSave(job)
	require.Nil(t, err)

	pageUrl = fmt.Sprintf("/jobs/summary/%s", job.ID)
	DoSimpleGetTest(t, pageUrl, expectedContent)

	// Path exists, and bag is unserialized, so
	// staleBagExists should be true
	job.PackageOp.BagItSerialization = constants.SerialFormatNone
	err = core.ObjSave(job)
	require.Nil(t, err)

	expectedContent = []string{
		"var staleBagExists =  true",
	}
	pageUrl = fmt.Sprintf("/jobs/summary/%s", job.ID)
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
	assert.True(t, jobResult.PayloadByteCount > int64(1500000), strconv.FormatInt(jobResult.PayloadByteCount, 10), whence)
	assert.True(t, jobResult.PayloadFileCount > int64(200), strconv.FormatInt(jobResult.PayloadFileCount, 10), whence)

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

func TestDeleteStaleUnserializedBag(t *testing.T) {
	defer core.ClearDartTable()

	// Set up a "stale bag directory" containing two files.
	tempDir, err := os.MkdirTemp("", "dart-stale-dir-*")
	require.Nil(t, err)

	file1 := filepath.Join(tempDir, "file1.txt")
	writeJunkFile(t, file1, "test file 1 for dart stale bag deletion")
	file2 := filepath.Join(tempDir, "file2.txt")
	writeJunkFile(t, file2, "test file 2 for dart stale bag deletion")

	assert.True(t, util.FileExists(tempDir))
	assert.True(t, util.FileExists(file1))
	assert.True(t, util.FileExists(file2))

	// Now set up a test job whose output path points
	// the temp directory we just created.
	job := loadTestJob(t)
	job.PackageOp.BagItSerialization = constants.SerialFormatNone
	job.PackageOp.OutputPath = tempDir
	require.NoError(t, core.ObjSave(job))
	require.NoError(t, core.ObjSave(job.BagItProfile))

	// Now test to see whether deleting the stale bag
	// works. It should.
	err = controllers.DeleteStaleUnserializedBag(job)
	require.Nil(t, err)

	assert.False(t, util.FileExists(file1))
	assert.False(t, util.FileExists(file2))
	assert.False(t, util.FileExists(tempDir))
}

func writeJunkFile(t *testing.T, filename, content string) {
	file, err := os.Create(filename)
	require.Nil(t, err)
	defer file.Close()

	_, err = file.WriteString(content)
	require.Nil(t, err)
}
