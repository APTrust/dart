package fileutil_test

import (
	"github.com/APTrust/easy-store/constants"
	"github.com/APTrust/easy-store/util"
	"github.com/APTrust/easy-store/util/fileutil"
	"github.com/APTrust/easy-store/util/testutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"io"
	"os"
	"strings"
	"testing"
)

func TestNewTarFileIterator(t *testing.T) {
	tarFilePath, err := testutil.GetPathToTestBag("example.edu.tagsample_good.tar")
	require.Nil(t, err)
	tfi, err := fileutil.NewTarFileIterator(tarFilePath)
	assert.NotNil(t, tfi)
	assert.Nil(t, err)
}

func TestTFINext(t *testing.T) {
	tarFilePath, err := testutil.GetPathToTestBag("example.edu.tagsample_good.tar")
	require.Nil(t, err)
	tfi, err := fileutil.NewTarFileIterator(tarFilePath)
	if tfi != nil {
		defer tfi.Close()
	}
	assert.NotNil(t, tfi)
	assert.Nil(t, err)

	for {
		reader, fileSummary, err := tfi.Next()
		if err == io.EOF {
			break
		}
		if reader == nil {
			assert.Fail(t, "Reader is nil")
		}
		if fileSummary == nil {
			assert.Fail(t, "FileSummary is nil")
		}
		if fileSummary.IsDir {
			continue
		}

		assert.NotEmpty(t, fileSummary.RelPath)
		assert.False(t, strings.HasPrefix(fileSummary.RelPath, string(os.PathSeparator)))
		// On Windows, where separator is '\', tar files may still use '/'
		assert.False(t, strings.HasPrefix(fileSummary.RelPath, "/"))
		assert.NotNil(t, fileSummary.Mode)
		if fileSummary.IsRegularFile {
			assert.True(t, fileSummary.Size > int64(0))
		}
		assert.False(t, fileSummary.ModTime.IsZero())

		buf := make([]byte, 1024)
		_, err = reader.Read(buf)
		if err != nil {
			assert.Equal(t, io.EOF, err)
		}
	}
}

// Should be able to close repeatedly without panic.
func TestTarFileIteratorClose(t *testing.T) {
	tarFilePath, err := testutil.GetPathToTestBag("example.edu.tagsample_good.tar")
	require.Nil(t, err)
	tfi, _ := fileutil.NewTarFileIterator(tarFilePath)
	if tfi == nil {
		assert.Fail(t, "Could not get TarFileIterator")
	}
	assert.NotPanics(t, tfi.Close, "TarFileIterator.Close() freaked out")
	assert.NotPanics(t, tfi.Close, "TarFileIterator.Close() freaked out")
}

func TestRead(t *testing.T) {
	// This is tested above, in the call to reader.Read(buf)
}

// Should be able to close repeatedly without error.
func TestTarReaderCloserClose(t *testing.T) {
	trc := fileutil.TarReadCloser{}
	err := trc.Close()
	assert.Nil(t, err)
	err = trc.Close()
	assert.Nil(t, err)
}

func TestTFIGetTopLevelDirNames(t *testing.T) {
	tarFilePath, err := testutil.GetPathToTestBag("example.edu.tagsample_good.tar")
	require.Nil(t, err)
	tfi, _ := fileutil.NewTarFileIterator(tarFilePath)
	if tfi == nil {
		assert.Fail(t, "Could not get TarFileIterator")
	}
	// Read the entire tar file, so we know the reader
	// has looked at all directories.
	for {
		_, _, err := tfi.Next()
		if err != nil {
			break
		}
	}
	topLevelDirs := tfi.GetTopLevelDirNames()
	require.NotEmpty(t, topLevelDirs)
	assert.Equal(t, 1, len(topLevelDirs))
	assert.Equal(t, "example.edu.tagsample_good", topLevelDirs[0])
}

func TestTFIOpenFile(t *testing.T) {
	tarFilePath, err := testutil.GetPathToTestBag("example.edu.tagsample_good.tar")
	require.Nil(t, err)
	tfi, err := fileutil.NewTarFileIterator(tarFilePath)
	if tfi != nil {
		defer tfi.Close()
	}
	assert.NotNil(t, tfi)
	require.Nil(t, err)

	readCloser, err := tfi.OpenFile("example.edu.tagsample_good/junk_file.txt")
	assert.Nil(t, err)
	assert.NotNil(t, readCloser)
	readCloser.Close()

	readCloser, err = tfi.OpenFile("example.edu.tagsample_good/tagmanifest-sha256.txt")
	assert.Nil(t, err)
	assert.NotNil(t, readCloser)
	readCloser.Close()

	readCloser, err = tfi.OpenFile("this-file-does-not-exist")
	assert.NotNil(t, err)
	assert.Nil(t, readCloser)
}

func TestTFIFindMatchingFiles(t *testing.T) {
	tarFilePath, err := testutil.GetPathToTestBag("example.edu.tagsample_good.tar")
	require.Nil(t, err)
	tfi, err := fileutil.NewTarFileIterator(tarFilePath)
	if tfi != nil {
		defer tfi.Close()
	}
	assert.NotNil(t, tfi)
	require.Nil(t, err)

	fileNames, err := tfi.FindMatchingFiles(constants.ReManifest)
	require.Nil(t, err)
	require.Equal(t, 2, len(fileNames))
	assert.True(t, util.StringListContains(fileNames, "manifest-md5.txt"))
	assert.True(t, util.StringListContains(fileNames, "manifest-sha256.txt"))

	tfi2, err := fileutil.NewTarFileIterator(tarFilePath)
	if tfi2 != nil {
		defer tfi2.Close()
	}
	assert.NotNil(t, tfi2)
	require.Nil(t, err)

	fileNames, err = tfi2.FindMatchingFiles(constants.ReTagManifest)
	require.Nil(t, err)
	require.Equal(t, 2, len(fileNames))
	assert.True(t, util.StringListContains(fileNames, "tagmanifest-md5.txt"))
	assert.True(t, util.StringListContains(fileNames, "tagmanifest-sha256.txt"))
}
