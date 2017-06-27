package core_test

import (
	"fmt"
	"github.com/APTrust/bagit/core"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"path/filepath"
	"runtime"
	"testing"
)

func getPathToProfile(profileName string) (string, error) {
	_, filename, _, ok := runtime.Caller(0)
	if !ok {
		return "", fmt.Errorf("Rumtime cannot get caller file name.")
	}
	absFileName, err := filepath.Abs(filename)
	if err != nil {
		return "", err
	}
	bagPath := filepath.Join(absFileName, "..", "..", "testdata", "profiles", profileName)
	return filepath.Abs(bagPath)
}

func TestLoadBagItProfile(t *testing.T) {
	aptrustFile, err := getPathToProfile("aptrust_bagit_profile_2.0.json")
	require.Nil(t, err)
	profile, err := core.LoadBagItProfile(aptrustFile)
	require.Nil(t, err)
	assert.EqualValues(t, []string{"0.97"}, profile.AcceptBagItVersion)
	assert.EqualValues(t, []string{"application/tar"}, profile.AcceptSerialization)
	assert.False(t, profile.AllowFetchTxt)
	assert.True(t, profile.AllowMiscTopLevelFiles)
	assert.True(t, profile.AllowMiscDirectories)
	assert.EqualValues(t, []string{"md5"}, profile.ManifestsRequired)
	assert.Equal(t, "required", profile.Serialization)
	assert.Empty(t, profile.TagManifestsRequired)
}
