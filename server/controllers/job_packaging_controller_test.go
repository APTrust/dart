package controllers_test

import (
	"fmt"
	"net/http"
	"net/url"
	"path/filepath"
	"testing"

	"github.com/APTrust/dart-runner/constants"
	"github.com/APTrust/dart-runner/core"
	"github.com/APTrust/dart-runner/util"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestJobShowPackaging(t *testing.T) {
	defer core.ClearDartTable()
	job := loadTestJob(t)
	require.NoError(t, core.ObjSave(job))
	require.NoError(t, core.ObjSave(job.BagItProfile))
	expectedContent := []string{
		"Package Format",
		"BagIt Profile",
		"BagIt Serialization",
		"Package Name",
		"Output Path",
		job.BagItProfile.Name,
		"application/tar",
		job.PackageOp.PackageName,
		job.PackageOp.OutputPath,
		"Back",
		"Next",
	}
	pageUrl := fmt.Sprintf("/jobs/packaging/%s", job.ID)
	DoSimpleGetTest(t, pageUrl, expectedContent)
}

func TestJobSavePackaging(t *testing.T) {
	defer core.ClearDartTable()
	job := loadTestJob(t)
	require.NoError(t, core.ObjSave(job))
	require.NoError(t, core.ObjSave(job.BagItProfile))
	pathToProfile := filepath.Join(util.ProjectRoot(), "profiles", "btr-v1.0-1.3.0.json")
	btrProfile, err := core.BagItProfileLoad(pathToProfile)
	require.Nil(t, err)
	require.NotNil(t, btrProfile)
	require.Nil(t, core.ObjSave(btrProfile))

	values := url.Values{}
	values.Set("direction", "next")
	values.Set("BagItSerialization", "application/zip")
	values.Set("OutputPath", "/path/to/some/baggervance.tar")
	values.Set("PackageFormat", constants.PackageFormatBagIt)
	values.Set("PackageName", "baggervance.tar")
	values.Set("BagItProfileID", btrProfile.ID)
	settings := PostTestSettings{
		EndpointUrl:              fmt.Sprintf("/jobs/packaging/%s", job.ID),
		Params:                   values,
		ExpectedResponseCode:     http.StatusFound,
		ExpectedRedirectLocation: fmt.Sprintf("/jobs/metadata/%s", job.ID),
	}
	DoSimplePostTest(t, settings)

	// Make sure the data was saved.
	result := core.ObjFind(job.ID)
	require.Nil(t, result.Error)
	job = result.Job()
	assert.Equal(t, "application/zip", job.PackageOp.BagItSerialization)
	assert.Equal(t, "/path/to/some/baggervance.tar", job.PackageOp.OutputPath)
	assert.Equal(t, constants.PackageFormatBagIt, job.PackageOp.PackageFormat)
	assert.Equal(t, "baggervance.tar", job.Name())
	assert.Equal(t, btrProfile.ID, job.BagItProfile.ID)
}
