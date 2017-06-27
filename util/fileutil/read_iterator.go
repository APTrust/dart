package fileutil

import (
	"io"
)

// ReadIterator is an interface that allows TarFileIterator and
// FileSystemIterator to be used interchangeably.
type ReadIterator interface {
	Next() (io.ReadCloser, *FileSummary, error)
	GetTopLevelDirNames() []string
}
