package fileutil_test

import (
	"archive/tar"
	"github.com/APTrust/bagit/constants"
	"github.com/APTrust/bagit/util/fileutil"
	"github.com/APTrust/bagit/util/testutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

var aptrustFile = pathToFile("aptrust_bagit_profile_2.0.json")
var dpnFile = pathToFile("dpn_bagit_profile.json")
var algorithms = []string{constants.MD5, constants.SHA256}

func TestNewTarWriter(t *testing.T) {
	dir, err := ioutil.TempDir("", "tarwriter_test")
	if err != nil {
		assert.FailNow(t, "Cannot create temp dir", err.Error())
	}
	tempFilePath := filepath.Join(dir, "test_file.tar")
	defer os.RemoveAll(dir)
	w := fileutil.NewTarWriter(tempFilePath)
	assert.NotNil(t, w)
	assert.Equal(t, tempFilePath, w.PathToTarFile)
}

func TestAndCloseOpen(t *testing.T) {
	dir, err := ioutil.TempDir("", "tarwriter_test")
	if err != nil {
		assert.FailNow(t, "Cannot create temp dir", err.Error())
	}
	tempFilePath := filepath.Join(dir, "test_file.tar")
	defer os.RemoveAll(dir)
	w := fileutil.NewTarWriter(tempFilePath)
	defer w.Close()
	err = w.Open()
	assert.Nil(t, err)
	if _, err := os.Stat(w.PathToTarFile); os.IsNotExist(err) {
		assert.Fail(t, "Tar file does not exist at %s", w.PathToTarFile)
	}
	err = w.Close()
	assert.Nil(t, err)
}

func TestAddToArchive(t *testing.T) {
	dir, err := ioutil.TempDir("", "tarwriter_test")
	if err != nil {
		assert.FailNow(t, "Cannot create temp dir", err.Error())
	}
	tempFilePath := filepath.Join(dir, "test_file.tar")
	defer os.RemoveAll(dir)
	w := fileutil.NewTarWriter(tempFilePath)
	defer w.Close()
	err = w.Open()
	assert.Nil(t, err)
	if _, err := os.Stat(w.PathToTarFile); os.IsNotExist(err) {
		assert.Fail(t, "Tar file does not exist at %s", w.PathToTarFile)
	}
	checksums, err := w.AddToArchive(aptrustFile, "file1.json", algorithms)
	assert.Nil(t, err)
	assert.Equal(t, "a13a800ede8aa0482a0a12fdce8ead43", checksums[constants.MD5])
	assert.Equal(t, "b27d2164559dddb7637938e96ab370d216204d4d3f163623c85fb5e65f5eca2f", checksums[constants.SHA256])
	checksums, err = w.AddToArchive(dpnFile, "data/subdir/file2.json", algorithms)
	assert.Nil(t, err)
	assert.Equal(t, "b850ee80942aa98d5b2e079e38aac844", checksums[constants.MD5])
	assert.Equal(t, "6096136f84d2182e29c5252c226d531a825dba495bd3e7a1ffd2c227545a11ae", checksums[constants.SHA256])
	w.Close()

	file, err := os.Open(w.PathToTarFile)
	if file != nil {
		defer file.Close()
	}
	if err != nil {
		assert.FailNow(t, "Could not open tar file", err.Error())
	}
	filesInArchive := make([]string, 0)
	reader := tar.NewReader(file)
	for {
		header, err := reader.Next()
		if err != nil {
			break
		}
		filesInArchive = append(filesInArchive, header.Name)
	}
	assert.Equal(t, "file1.json", filesInArchive[0])
	assert.Equal(t, "data/subdir/file2.json", filesInArchive[1])
}

func TestAddToArchiveWithClosedWriter(t *testing.T) {
	dir, err := ioutil.TempDir("", "tarwriter_test")
	if err != nil {
		assert.FailNow(t, "Cannot create temp dir", err.Error())
	}
	tempFilePath := filepath.Join(dir, "test_file.tar")
	defer os.RemoveAll(dir)
	w := fileutil.NewTarWriter(tempFilePath)

	// Note that we have not opened the writer
	_, err = w.AddToArchive(aptrustFile, "file1.json", algorithms)
	require.NotNil(t, err)
	assert.True(t, strings.HasPrefix(err.Error(), "Underlying TarWriter is nil"))

	// Open and close the writer, so the file exists.
	w.Open()
	w.Close()
	if _, err := os.Stat(w.PathToTarFile); os.IsNotExist(err) {
		assert.Fail(t, "Tar file does not exist at %s", w.PathToTarFile)
	}
	_, err = w.AddToArchive(aptrustFile, "file1.json", algorithms)
	require.NotNil(t, err)
	assert.True(t, strings.HasPrefix(err.Error(), "archive/tar: write after close"))

}

func TestAddToArchiveWithBadFilePath(t *testing.T) {
	dir, err := ioutil.TempDir("", "tarwriter_test")
	if err != nil {
		assert.FailNow(t, "Cannot create temp dir", err.Error())
	}
	tempFilePath := filepath.Join(dir, "test_file.tar")
	defer os.RemoveAll(dir)
	w := fileutil.NewTarWriter(tempFilePath)
	defer w.Close()
	err = w.Open()
	assert.Nil(t, err)
	if _, err := os.Stat(w.PathToTarFile); os.IsNotExist(err) {
		assert.Fail(t, "Tar file does not exist at %s", w.PathToTarFile)
	}

	// This file doesn't exist. Make sure we get the right error.
	_, err = w.AddToArchive(pathToFile("this_file_does_not_exist"), "file1.json", algorithms)
	require.NotNil(t, err)
	assert.True(t, strings.Contains(err.Error(), "no such file or directory"))
}

func pathToFile(filename string) string {
	fullPath, _ := testutil.GetPathToTestProfile(filename)
	return fullPath
}
