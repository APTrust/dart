package fileutil_test

import (
	"github.com/APTrust/bagit/util"
	"github.com/APTrust/bagit/util/fileutil"
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
	if fileutil.FileExists(filename) == false {
		t.Errorf("FileExists returned false for fileutil_test.go")
	}
	if fileutil.FileExists("NonExistentFile.xyz") == true {
		t.Errorf("FileExists returned true for NonExistentFile.xyz")
	}
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

	// "/Users/apd4n/go/src/github.com/APTrust/bagit/util/fileutil/fileutil.go",
	// "/Users/apd4n/go/src/github.com/APTrust/bagit/util/fileutil/fileutil_test.go",
	// "/Users/apd4n/go/src/github.com/APTrust/bagit/util/util.go",
	// "/Users/apd4n/go/src/github.com/APTrust/bagit/util/util_test.go",

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

}
