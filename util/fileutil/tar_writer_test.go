package fileutil_test

import (
	"archive/tar"
	"github.com/APTrust/easy-store/constants"
	"github.com/APTrust/easy-store/util/fileutil"
	"github.com/APTrust/easy-store/util/testutil"
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
	assert.Equal(t, "e46113f04181fa368c3026e93e7d6153", checksums[constants.MD5])
	assert.Equal(t, "3696162e57e14a223eaafc33980769089c8c3ba383ffa8e49e24f4dbc04e7412", checksums[constants.SHA256])
	checksums, err = w.AddToArchive(dpnFile, "data/subdir/file2.json", algorithms)
	assert.Nil(t, err)
	assert.Equal(t, "e79ad6b879ba59c4bc953f461d1209f6", checksums[constants.MD5])
	assert.Equal(t, "5f9353adde970689f42aa5f59162e98cf0d883b322d01675d50237ed540a3459", checksums[constants.SHA256])
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
