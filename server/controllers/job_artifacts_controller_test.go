package controllers_test

import (
	"fmt"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"testing"

	"github.com/APTrust/dart-runner/constants"
	"github.com/APTrust/dart-runner/core"
	"github.com/APTrust/dart-runner/util"
	"github.com/APTrust/dart/v3/server/controllers"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestJobArtifactList(t *testing.T) {
	defer core.ClearArtifactsTable()

	job := core.NewJob()
	job.ID = constants.EmptyUUID
	require.NoError(t, core.ObjSaveWithoutValidation(job))

	artifact1 := core.NewTagFileArtifact("testbag.tar", constants.EmptyUUID, "manifest-test.txt", "Four and twenty blackbirds sitting in a tree...")
	artifact2 := core.NewTagFileArtifact("testbag.tar", constants.EmptyUUID, "tagmanifest-test.txt", "Thirteen ways of looking at a blackbird...")
	require.NoError(t, core.ArtifactSave(artifact1))
	require.NoError(t, core.ArtifactSave(artifact2))
	expected := []string{
		artifact1.FileName,
		artifact1.ID,
		artifact2.FileName,
		artifact2.ID,
	}
	endpointUrl := fmt.Sprintf("/jobs/artifacts/list/%s", job.ID)
	DoSimpleGetTest(t, endpointUrl, expected)
}

func TestJobArtifactShow(t *testing.T) {
	defer core.ClearArtifactsTable()

	_, artifact := createTestJobAndArtifact(t)
	expected := []string{
		artifact.FileName,
		artifact.RawData,
	}
	endpointUrl := fmt.Sprintf("/jobs/artifacts/%s", artifact.ID)
	DoSimpleGetTest(t, endpointUrl, expected)
}

func TestJobArtifactSave(t *testing.T) {
	defer core.ClearArtifactsTable()

	_, artifact := createTestJobAndArtifact(t)
	outputDir, outputFile, err := controllers.ArtifactOutputDirAndFileName(artifact)
	require.Nil(t, err)
	assert.NotEmpty(t, outputDir)
	assert.NotEmpty(t, outputFile)

	expected := []string{
		outputDir,
		outputFile,
	}

	defer func() {
		if util.LooksSafeToDelete(outputDir, 3, 2) {
			os.RemoveAll(outputDir)
		}
	}()

	settings := PostTestSettings{
		EndpointUrl:          fmt.Sprintf("/jobs/artifacts/save/%s", artifact.ID),
		Params:               url.Values{},
		ExpectedResponseCode: http.StatusCreated,
		ExpectedContent:      expected,
	}
	DoSimplePostTest(t, settings)

	require.True(t, util.FileExists(outputDir))
	require.True(t, util.FileExists(outputFile))

	content, err := os.ReadFile(outputFile)
	require.Nil(t, err)
	assert.Equal(t, "Four and twenty blackbirds sitting in a tree...", string(content))
}

func TestJobArtifactOutputDirAndFileName(t *testing.T) {
	defer core.ClearArtifactsTable()
	_, artifact := createTestJobAndArtifact(t)
	outputDir, outputFile, err := controllers.ArtifactOutputDirAndFileName(artifact)
	require.Nil(t, err)

	baggingDir := filepath.Join(core.Dart.Paths.Documents, "DART")

	assert.Equal(t, path.Join(baggingDir, "testbag.tar", "logs"), outputDir)
	assert.Equal(t, path.Join(baggingDir, "testbag.tar", "logs", artifact.FileName), outputFile)
}

func createTestJobAndArtifact(t *testing.T) (*core.Job, *core.Artifact) {
	job := core.NewJob()
	job.ID = constants.EmptyUUID
	require.NoError(t, core.ObjSaveWithoutValidation(job))

	artifact := core.NewTagFileArtifact("testbag.tar", constants.EmptyUUID, "manifest-test.txt", "Four and twenty blackbirds sitting in a tree...")
	require.NoError(t, core.ArtifactSave(artifact))

	return job, artifact
}
