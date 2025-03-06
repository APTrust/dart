package controllers_test

import (
	"fmt"
	"testing"

	"github.com/APTrust/dart-runner/constants"
	"github.com/APTrust/dart-runner/core"
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

	job := core.NewJob()
	job.ID = constants.EmptyUUID
	require.NoError(t, core.ObjSaveWithoutValidation(job))

	artifact := core.NewTagFileArtifact("testbag.tar", constants.EmptyUUID, "manifest-test.txt", "Four and twenty blackbirds sitting in a tree...")
	require.NoError(t, core.ArtifactSave(artifact))
	expected := []string{
		artifact.FileName,
		artifact.RawData,
	}
	endpointUrl := fmt.Sprintf("/jobs/artifact/%s", artifact.ID)
	DoSimpleGetTest(t, endpointUrl, expected)
}
