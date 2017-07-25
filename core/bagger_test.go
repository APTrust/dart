package core_test

import (
	//	"fmt"
	"github.com/APTrust/bagit/core"
	"github.com/APTrust/bagit/util/testutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"io/ioutil"
	"os"
	//	"path/filepath"
	//	"runtime"
	"testing"
)

func TestNewBagger(t *testing.T) {
	tempFile, err := ioutil.TempFile("", "bagger")
	defer tempFile.Close()
	defer os.Remove(tempFile.Name())
	require.Nil(t, err)

	payloadDir, err := testutil.GetPathToTestFileDir()
	require.Nil(t, err)

	profilePath, err := testutil.GetPathToTestProfile("aptrust_bagit_profile_2.0.json")
	require.Nil(t, err)
	aptrustProfile, err := core.LoadBagItProfile(profilePath)
	require.Nil(t, err)

	bagger := core.NewBagger(tempFile.Name(), payloadDir, aptrustProfile, nil, false)
	require.NotNil(t, bagger)
	require.NotNil(t, bagger.Bag)
	assert.Equal(t, tempFile.Name(), bagger.Bag.Path)
	assert.Equal(t, payloadDir, bagger.PayloadDir)
	assert.Nil(t, bagger.TagValues)
	assert.False(t, bagger.ForceOverwrite)

	tagValues := map[string]string{
		"one": "first",
		"two": "second",
	}

	bagger = core.NewBagger(tempFile.Name(), payloadDir, aptrustProfile, tagValues, true)
	require.NotNil(t, bagger)
	require.NotNil(t, bagger.Bag)
	assert.Equal(t, tempFile.Name(), bagger.Bag.Path)
	assert.Equal(t, payloadDir, bagger.PayloadDir)
	require.NotNil(t, bagger.TagValues)
	assert.Equal(t, "first", bagger.TagValues["one"])
	assert.Equal(t, "second", bagger.TagValues["two"])
	assert.True(t, bagger.ForceOverwrite)
}

func TestBuildBag(t *testing.T) {

}
