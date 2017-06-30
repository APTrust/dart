package fileutil

import (
	"os"
	"time"
)

// FileSummary includes the intersection of the set of
// file attributes available from os.FileInfo and tar.Header.
type FileSummary struct {
	RelPath       string
	Mode          os.FileMode
	Size          int64
	ModTime       time.Time
	IsDir         bool
	IsRegularFile bool
	Uid           int
	Gid           int
}
