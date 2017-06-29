package fileutil

import (
	"io"
)

// ReadIterator is an interface that allows TarFileIterator and
// FileSystemIterator to be used interchangeably.
type ReadIterator interface {
	Close()
	GetTopLevelDirNames() []string
	Next() (io.ReadCloser, *FileSummary, error)
	OpenFile(filePath string) (io.ReadCloser, error)
}
