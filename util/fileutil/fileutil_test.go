package fileutil_test

import (
	"github.com/APTrust/bagit/constants"
	"github.com/APTrust/bagit/util"
	"github.com/APTrust/bagit/util/fileutil"
	"github.com/APTrust/bagit/util/testutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func TestFileExists(t *testing.T) {
	_, filename, _, ok := runtime.Caller(0)
	require.True(t, ok)
	assert.True(t, fileutil.IsFile(filename))
	assert.False(t, fileutil.IsFile("NonExistentFile.xyz"))
}

func TestIsFile(t *testing.T) {
	_, filename, _, ok := runtime.Caller(0)
	require.True(t, ok)
	assert.True(t, fileutil.IsFile(filename))
	assert.False(t, fileutil.IsFile(filepath.Dir(filename)))
}

func TestIsDir(t *testing.T) {
	_, filename, _, ok := runtime.Caller(0)
	require.True(t, ok)
	assert.False(t, fileutil.IsDir(filename))
	assert.True(t, fileutil.IsDir(filepath.Dir(filename)))
}

func TestExpandTilde(t *testing.T) {
	expanded, err := fileutil.ExpandTilde("~/tmp")
	if err != nil {
		t.Error(err)
	}
	// Testing this cross-platform is pain. Different home dirs
	// on Windows, Linux, Mac. Different separators ("/" vs "\").
	if len(expanded) <= 5 || !strings.HasSuffix(expanded, "tmp") {
		t.Errorf("~/tmp expanded to unexpected value %s", expanded)
	}

	expanded, err = fileutil.ExpandTilde("/nothing/to/expand")
	if err != nil {
		t.Error(err)
	}
	if expanded != "/nothing/to/expand" {
		t.Errorf("/nothing/to/expand expanded to unexpected value %s", expanded)
	}
}

func TestRecursiveFileList(t *testing.T) {
	_, filename, _, ok := runtime.Caller(0)
	require.True(t, ok)
	absFileName, err := filepath.Abs(filename)
	require.Nil(t, err)

	utilDir := string(os.PathSeparator) + "util" + string(os.PathSeparator)
	dirPrefix := strings.Split(absFileName, utilDir)[0]
	dirPrefix += utilDir

	twoLevelsUp := filepath.Join(absFileName, "..", "..")
	dir, err := filepath.Abs(twoLevelsUp)
	require.Nil(t, err)
	files, err := fileutil.RecursiveFileList(dir)
	require.Nil(t, err)

	assert.True(t, util.StringListContains(files, filepath.Join(dirPrefix, "fileutil", "fileutil.go")))
	assert.True(t, util.StringListContains(files, filepath.Join(dirPrefix, "fileutil", "fileutil_test.go")))
	assert.True(t, util.StringListContains(files, filepath.Join(dirPrefix, "util.go")))
	assert.True(t, util.StringListContains(files, filepath.Join(dirPrefix, "util_test.go")))
}

func TestLooksSafeToDelete(t *testing.T) {
	assert.True(t, fileutil.LooksSafeToDelete("/mnt/apt/data/some_dir", 15, 3))
	assert.False(t, fileutil.LooksSafeToDelete("/usr/local", 12, 3))
}

func TestCalculateChecksums(t *testing.T) {
	bagPath, err := testutil.GetPathToTestBag("example.edu.tagsample_good.tar")
	require.Nil(t, err)

	// Calculate the two most common checksums, and make sure we get only those.
	algs := []string{constants.MD5, constants.SHA256}
	checksums, err := fileutil.CalculateChecksums(bagPath, algs)
	require.Nil(t, err)

	assert.Equal(t, 2, len(checksums))
	assert.Equal(t, "3f6dc525527b5d87ca42ad3d7e3abbcd", checksums[constants.MD5])
	assert.Equal(t, "85be22159f728d5194cbbd69ff6b2bcf0af4fe3ec79ae101b6a4a044fd8c2c86", checksums[constants.SHA256])

	// Calculate all supported hash algorithms on this file.
	checksums, err = fileutil.CalculateChecksums(bagPath, constants.HashAlgorithms)
	require.Nil(t, err)

	assert.Equal(t, len(constants.HashAlgorithms), len(checksums))
	assert.Equal(t, "1f1201954db6371462415137a2401fed", checksums[constants.MD4])
	assert.Equal(t, "3f6dc525527b5d87ca42ad3d7e3abbcd", checksums[constants.MD5])
	assert.Equal(t, "689c4cd3bfaedc63ea329b063438b4c60f8c9b7f", checksums[constants.SHA1])
	assert.Equal(t, "6b1a785580495a2f86130807bb5fc7e44dc5b42e3e1b27fb4ee7a68e", checksums[constants.SHA224])
	assert.Equal(t, "85be22159f728d5194cbbd69ff6b2bcf0af4fe3ec79ae101b6a4a044fd8c2c86", checksums[constants.SHA256])
	assert.Equal(t, "d52762618913de4792b8f0044fc021bc4eadb853e8deb854c2a2378fb5171f811b4596c391dd198d0831a9631aebe8c6", checksums[constants.SHA384])
	assert.Equal(t, "0e0b2181ce78ea879e962cf3731cb9631d26ce04cd0c1a71765b32625a3ee7bd8209de6b8beee80657ecb449d3ab7300fbf6231c9287e51bbd6637e6e25ff0d9", checksums[constants.SHA512])

}
