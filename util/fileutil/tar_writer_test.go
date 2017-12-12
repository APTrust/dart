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

var aptrustFile = pathToFile("aptrust_bagit_profile_2.1.json")
var dpnFile = pathToFile("dpn_bagit_profile_2.1.json")
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
	assert.Equal(t, "807c49b728c85a563990c9c00bda2ca8", checksums[constants.MD5])
	assert.Equal(t, "e28918b4941d30f34824f5e53f2c6c98952f577b21a8cc98347c172f3a4806f3", checksums[constants.SHA256])
	checksums, err = w.AddToArchive(dpnFile, "data/subdir/file2.json", algorithms)
	assert.Nil(t, err)
	assert.Equal(t, "519e171ee45707b8bac1e4a2fd514e9a", checksums[constants.MD5])
	assert.Equal(t, "0fa24fecb8a2333ca32fd85c6c1cc073a8e73a5c0371bc56280a9abe11a72310", checksums[constants.SHA256])
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
