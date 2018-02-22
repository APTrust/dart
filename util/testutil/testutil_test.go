package testutil_test

import (
	"github.com/APTrust/easy-store/util/fileutil"
	"github.com/APTrust/easy-store/util/testutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestGetPathToTestData(t *testing.T) {
	path, err := testutil.GetPathToTestData()
	require.Nil(t, err)
	assert.True(t, strings.HasSuffix(path, filepath.Join("easy-store", "testdata")))
}

func TestGetPathToTestBag(t *testing.T) {
	path, err := testutil.GetPathToTestBag("example.edu.tagsample_good.tar")
	require.Nil(t, err)
	assert.True(t, strings.HasSuffix(path, filepath.Join("easy-store", "testdata", "bags", "example.edu.tagsample_good.tar")))
}

func TestGetPathToTestProfile(t *testing.T) {
	path, err := testutil.GetPathToTestProfile("dpn_bagit_profile.json")
	require.Nil(t, err)
	assert.True(t, strings.HasSuffix(path, filepath.Join("easy-store", "testdata", "profiles", "dpn_bagit_profile.json")))
}

func TestGetPathToTestFile(t *testing.T) {
	path, err := testutil.GetPathToTestFile("sample.txt")
	require.Nil(t, err)
	assert.True(t, strings.HasSuffix(path, filepath.Join("easy-store", "testdata", "files", "sample.txt")))
}

func TestGetPathToTestFileDir(t *testing.T) {
	path, err := testutil.GetPathToTestFileDir()
	require.Nil(t, err)
	assert.True(t, strings.HasSuffix(path, filepath.Join("easy-store", "testdata", "files")))
}

func TestGetPathToJob(t *testing.T) {
	path, err := testutil.GetPathToJob("job_sample.json")
	require.Nil(t, err)
	assert.True(t, strings.HasSuffix(path, filepath.Join("testdata", "jobs", "job_sample.json")))
}

func TestUntarTestBag(t *testing.T) {
	pathToTarFile, err := testutil.GetPathToTestBag("example.edu.tagsample_good.tar")
	require.Nil(t, err)
	tempDir, pathToUntarredBag, err := testutil.UntarTestBag(pathToTarFile)
	defer os.RemoveAll(tempDir)
	defer os.RemoveAll(pathToUntarredBag)
	require.Nil(t, err)
	assert.NotEmpty(t, tempDir)
	assert.Equal(t, filepath.Join(tempDir, "example.edu.tagsample_good"), pathToUntarredBag)
	files, err := fileutil.RecursiveFileList(pathToUntarredBag)
	assert.Equal(t, 16, len(files))
}
