package controllers_test

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"testing"

	"github.com/APTrust/dart-runner/core"
	"github.com/APTrust/dart-runner/util"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func loadTestJob(t *testing.T) *core.Job {
	filename := filepath.Join(util.PathToTestData(), "files", "aptrust_unit_test_job.json")
	data, err := os.ReadFile(filename)
	require.Nil(t, err)
	job := &core.Job{}
	err = json.Unmarshal(data, job)
	require.Nil(t, err)
	require.NotNil(t, job)

	// Note that because this is a pre-made test job,
	// we know for sure that it has a PackageOp, a
	// ValidationOp, and at least one UploadOp.
	outputPath := filepath.Join(os.TempDir(), "JobFilesControllerTest.tar")
	job.PackageOp.OutputPath = outputPath
	job.ValidationOp.PathToBag = outputPath
	job.UploadOps[0].SourceFiles = []string{outputPath}

	// Since paths will differ on each machine, we
	// need to set the source files dynamically so
	// we know they exist. This gives us three directories
	// from the current project with a variety of file types.
	job.PackageOp.SourceFiles = []string{
		filepath.Join(util.ProjectRoot(), "core"),
		filepath.Join(util.ProjectRoot(), "testdata"),
		filepath.Join(util.ProjectRoot(), "util"),
	}

	return job
}

func TestJobShowFiles(t *testing.T) {
	defer core.ClearDartTable()
	job := loadTestJob(t)
	assert.NoError(t, core.ObjSave(job))

	// Things we expect to see on this page:
	// Some headings and our list of source files.
	//
	// Also check for the buttons on the bottom
	// (Delete and Next). If there's a rendering problem
	// due to undefined variable references, these bottom
	// buttons won't render.
	expected := []string{
		"Files",
		"Desktop",
		"Documents",
		"Downloads",
		"File Path",
		"Directories",
		"Files",
		"Total Size",
		"Delete Job",
		"Next",
		fmt.Sprintf("/jobs/add_file/%s", job.ID),
		fmt.Sprintf("/jobs/delete/%s", job.ID),
		fmt.Sprintf("/jobs/delete_file/%s", job.ID),
		fmt.Sprintf("/jobs/packaging/%s", job.ID),
	}
	expected = append(expected, job.PackageOp.SourceFiles...)

	DoSimpleGetTest(t, fmt.Sprintf("/jobs/files/%s", job.ID), expected)

}

func TestJobAddFile(t *testing.T) {
	defer core.ClearDartTable()
	job := loadTestJob(t)
	assert.NoError(t, core.ObjSave(job))

	// Add a new file to this job via JobAddFile.
	// Make sure we get the expected redirect and not an error.
	fileToAdd := filepath.Join(util.PathToTestData(), "files", "sample_job.json")
	params := url.Values{}
	params.Add("fullPath", fileToAdd)
	postTestSettings := PostTestSettings{
		EndpointUrl:              fmt.Sprintf("/jobs/add_file/%s", job.ID),
		Params:                   params,
		ExpectedResponseCode:     http.StatusFound,
		ExpectedRedirectLocation: fmt.Sprintf("/jobs/files/%s?directory=", job.ID),
	}
	DoSimplePostTest(t, postTestSettings)

	// Now load the files page and make sure all of the original
	// files plus the new one we just added are present.
	expected := make([]string, len(job.PackageOp.SourceFiles))
	copy(expected, job.PackageOp.SourceFiles)
	expected = append(expected, fileToAdd)
	DoSimpleGetTest(t, fmt.Sprintf("/jobs/files/%s", job.ID), expected)
}

func TestJobDeleteFile(t *testing.T) {
	defer core.ClearDartTable()
	job := loadTestJob(t)
	assert.NoError(t, core.ObjSave(job))

	// Delete the server/assets folder from the job.
	fileToDelete := job.PackageOp.SourceFiles[1]
	params := url.Values{}
	params.Add("fullPath", fileToDelete)
	postTestSettings := PostTestSettings{
		EndpointUrl:              fmt.Sprintf("/jobs/delete_file/%s", job.ID),
		Params:                   params,
		ExpectedResponseCode:     http.StatusFound,
		ExpectedRedirectLocation: fmt.Sprintf("/jobs/files/%s?directory=", job.ID),
	}
	DoSimplePostTest(t, postTestSettings)

	// Make sure that file was actually removed from the job.
	result := core.ObjFind(job.ID)
	require.Nil(t, result.Error)
	sourceFiles := result.Job().PackageOp.SourceFiles
	assert.Equal(t, 2, len(sourceFiles))
	assert.False(t, util.StringListContains(sourceFiles, fileToDelete))
}
