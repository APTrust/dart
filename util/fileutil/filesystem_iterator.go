package fileutil

import (
	"fmt"
	"github.com/APTrust/bagit/util/platform"
	"io"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strings"
)

type FileSystemIterator struct {
	rootPath string
	files    []string
	index    int
}

func NewFileSystemIterator(pathToDir string) (*FileSystemIterator, error) {
	if !path.IsAbs(pathToDir) {
		return nil, fmt.Errorf("Path '%s' must be absolute.", pathToDir)
	}
	var stat os.FileInfo
	var err error
	if stat, err = os.Stat(pathToDir); os.IsNotExist(err) {
		return nil, fmt.Errorf("Directory '%s' does not exist.", pathToDir)
	}
	if !stat.IsDir() {
		return nil, fmt.Errorf("Path '%s' is not a directory.", pathToDir)
	}
	files, err := RecursiveFileList(pathToDir)
	if err != nil {
		return nil, err
	}
	return &FileSystemIterator{
		rootPath: pathToDir,
		files:    files,
		index:    -1,
	}, nil
}

// Close is a no-op. It's here so that FileSystemIterator can adhere
// to the ReadIterator interface.
func (iter *FileSystemIterator) Close() {
	return
}

// Returns an open reader for the next file, along with a FileSummary.
// Returns io.EOF when it reaches the last file.
// The caller is responsible for closing the reader.
func (iter *FileSystemIterator) Next() (io.ReadCloser, *FileSummary, error) {
	iter.index += 1
	if iter.index >= len(iter.files) {
		return nil, nil, io.EOF
	}
	filePath := iter.files[iter.index]
	var stat os.FileInfo
	var err error
	if stat, err = os.Stat(filePath); os.IsNotExist(err) {
		return nil, nil, fmt.Errorf("File '%s' does not exist.", filePath)
	}
	fileMode := stat.Mode()
	fs := &FileSummary{
		RelPath:       strings.Replace(filePath, iter.rootPath+string(os.PathSeparator), "", 1),
		Mode:          fileMode,
		Size:          stat.Size(),
		ModTime:       stat.ModTime(),
		IsDir:         stat.IsDir(),
		IsRegularFile: fileMode.IsRegular(),
	}
	uid, gid := platform.FileOwnerAndGroup(stat)
	fs.Uid = uid
	fs.Gid = gid
	file, err := os.Open(filePath)
	if err != nil {
		return nil, fs, fmt.Errorf("Cannot read file '%s': %v", filePath, err)
	}
	return file, fs, nil
}

// OpenFile opens the file at filePath, and returns an open reader for it.
// It's the caller's job to close the reader. Param filePath should
// be the relative path of the file within the bag. Will return a
// nil ReadCloser and an error if file is not found.
func (iter *FileSystemIterator) OpenFile(filePath string) (io.ReadCloser, error) {
	fullPath := filepath.Join(iter.rootPath, filePath)
	if !FileExists(fullPath) {
		return nil, fmt.Errorf("File %s does not exist", fullPath)
	}
	return os.Open(fullPath)
}

// FindMatchingFiles returns a list of files whose names match
// the supplied regular expression.
func (iter *FileSystemIterator) FindMatchingFiles(regex *regexp.Regexp) ([]string, error) {
	matches := make([]string, 0)
	checkFile := func(pathToFile string, info os.FileInfo, err error) error {
		matches = append(matches, pathToFile)
		return nil
	}
	err := filepath.Walk(iter.rootPath, checkFile)
	return matches, err
}

// Returns the last component of the path that this iterator is traversing.
// That will be a slice of strings, with exactly one item. We return a slice
// instead of a string to maintain API compatibility with the ReadIterator
// interface.
func (iter *FileSystemIterator) GetTopLevelDirNames() []string {
	pathParts := strings.Split(iter.rootPath, string(os.PathSeparator))
	topLevelDirs := make([]string, 1)
	topLevelDirs[0] = pathParts[len(pathParts)-1]
	return topLevelDirs
}
