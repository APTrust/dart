package bagit_test

import (
	"github.com/APTrust/dart/bagit"
	"github.com/APTrust/dart/util/testutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestLoadJobFromFile(t *testing.T) {
	jsonFile, err := testutil.GetPathToJob("sample_job.json")
	require.Nil(t, err)
	job, err := bagit.LoadJobFromFile(jsonFile)
	require.Nil(t, err)
	require.NotNil(t, job)
	require.NotNil(t, job.BagItProfile)
	require.Equal(t, 2, len(job.StorageServices))
}

func TestJobValidate(t *testing.T) {
	jsonFile, err := testutil.GetPathToJob("sample_job.json")
	require.Nil(t, err)
	job, err := bagit.LoadJobFromFile(jsonFile)
	require.Nil(t, err)
	require.NotNil(t, job)

	errors := job.Validate()
	assert.Empty(t, errors)

	job.StorageServices = make([]*bagit.StorageService, 0)
	job.Files = make([]string, 0)

	errors = job.Validate()
	require.Equal(t, 1, len(errors))
	assert.Equal(t, "This job has no files.", errors[0].Error())

	job.BaggingDirectory = ""
	errors = job.Validate()
	require.Equal(t, 2, len(errors))
	assert.Equal(t, "You must specify a bagging directory.", errors[1].Error())

	job.BagItProfile = nil
	errors = job.Validate()
	require.Equal(t, 2, len(errors))
	assert.Equal(t, "This job has no files.", errors[0].Error())
	assert.Equal(t, "This job must have either a BagIt Profile, or a Storage Service, or both.", errors[1].Error())
}

func TestShouldIncludeFile(t *testing.T) {
	jsonFile, err := testutil.GetPathToJob("sample_job.json")
	require.Nil(t, err)
	job, err := bagit.LoadJobFromFile(jsonFile)
	require.Nil(t, err)
	require.NotNil(t, job)

	job.Options.SkipDSStore = true
	job.Options.SkipDotKeep = false
	job.Options.SkipHiddenFiles = false

	assert.False(t, job.ShouldIncludeFile("data/.DS_Store"))
	assert.False(t, job.ShouldIncludeFile("data/._DS_Store"))
	assert.True(t, job.ShouldIncludeFile("data/.hidden"))
	assert.True(t, job.ShouldIncludeFile("data/.keep"))

	job.Options.SkipDSStore = false
	job.Options.SkipDotKeep = false
	job.Options.SkipHiddenFiles = true

	assert.False(t, job.ShouldIncludeFile("data/.DS_Store"))
	assert.False(t, job.ShouldIncludeFile("data/._DS_Store"))
	assert.False(t, job.ShouldIncludeFile("data/.hidden"))
	assert.True(t, job.ShouldIncludeFile("data/.keep"))

	job.Options.SkipDSStore = false
	job.Options.SkipDotKeep = true
	job.Options.SkipHiddenFiles = false

	assert.False(t, job.ShouldIncludeFile("data/.DS_Store"))
	assert.False(t, job.ShouldIncludeFile("data/._DS_Store"))
	assert.False(t, job.ShouldIncludeFile("data/.hidden"))
	assert.False(t, job.ShouldIncludeFile("data/.keep"))

	job.Options.SkipDSStore = false
	job.Options.SkipDotKeep = false
	job.Options.SkipHiddenFiles = false

	assert.True(t, job.ShouldIncludeFile("data/.DS_Store"))
	assert.True(t, job.ShouldIncludeFile("data/._DS_Store"))
	assert.True(t, job.ShouldIncludeFile("data/.hidden"))
	assert.True(t, job.ShouldIncludeFile("data/.keep"))
}
