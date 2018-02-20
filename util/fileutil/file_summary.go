package fileutil

import (
	"archive/tar"
	"fmt"
	"github.com/APTrust/easy-store/util/platform"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// FileSummary includes the intersection of the set of
// file attributes available from os.FileInfo and tar.Header.
type FileSummary struct {
	// AbsPath is the absolute path of the file on disk.
	// This will be an empty string if the file is inside
	// a tar archive.
	AbsPath string
	// RelPath is the relative path of the file within the
	// bag. A typical payload file would have a RelPath like
	// "data/document.pdf".
	RelPath string
	// Mode is the file mode (permission set) of the file.
	// For example, 0644 has read/write privileges for the
	// owner and read-only for others.
	Mode os.FileMode
	// Size is the size of the file in bytes.
	Size int64
	// ModTime is the time the file was last modified.
	ModTime time.Time
	// IsDir is true if the file is directory.
	IsDir bool
	// IsRegularFile is true if the file is regular file
	// (i.e. not a directory or a link).
	IsRegularFile bool
	// Uid is the id of the user who owns the file. This
	// will be zero when bagging files on non-posix systems.
	Uid int
	// Gid is the id of the group that owns the file. This
	// will be zero when bagging files on non-posix systems.
	Gid int
}

// NewFileSummaryFromPath returns a new FileSummary object
// that describes the file at the given path. The RelPath of
// the FileSummary object will not be set. The caller can set
// that property as needed.
func NewFileSummaryFromPath(pathToFile string) (*FileSummary, error) {
	fileInfo, err := os.Stat(pathToFile)
	if err != nil {
		return nil, err
	}
	uid, gid := platform.FileOwnerAndGroup(fileInfo)
	absPath, _ := filepath.Abs(pathToFile)
	return &FileSummary{
		AbsPath:       absPath,
		RelPath:       "", // Let the caller set this
		Mode:          fileInfo.Mode(),
		Size:          fileInfo.Size(),
		ModTime:       fileInfo.ModTime(),
		IsDir:         fileInfo.IsDir(),
		IsRegularFile: fileInfo.Mode().IsRegular(),
		Uid:           uid,
		Gid:           gid,
	}, nil
}

// NewFileSummaryFromTarHeader returns a new FileSummary object from
// the tar header record. The FileSummary object describes properties
// of the record that the tar header points to. The caller should set
// trimPrefix to the name of the tar file's top-level directory, including
// the slash, like so:
//
// "bag_1337/"
//
// This is so the RelPath property of the FileSummary can be set correctly.
// The BagIt spec says the top-level directory in a tarred bag should
// match the name of the bag, so that when it's untarred, it produces a
// directory with a meaningful name.
//
// However, in most cases, you won't want that directory to be part of
// the file's relative path within the bag. For example, the following
// tar headers will produce the following RelPath settings, if you set
// trimPrefix to "bag_1337/":
//
// "bag_1337/manifest-md5.txt" => "manifest-md5.txt"
// "bag_1337/data/image1.tiff" => "data/image1.tiff"
//
// This is typically what you want. If it's not, pass in an empty string
// for trimPrefix.
func NewFileSummaryFromTarHeader(header *tar.Header, trimPrefix string) (*FileSummary, error) {
	if header == nil {
		return nil, fmt.Errorf("Param header cannot be nil")
	}
	relPathInArchive := strings.Replace(header.Name, trimPrefix, "", 1)
	finfo := header.FileInfo()
	return &FileSummary{
		AbsPath:       "",
		RelPath:       relPathInArchive,
		Mode:          finfo.Mode(),
		Size:          header.Size,
		ModTime:       header.ModTime,
		IsDir:         header.Typeflag == tar.TypeDir,
		IsRegularFile: header.Typeflag == tar.TypeReg || header.Typeflag == tar.TypeRegA,
		Uid:           header.Uid,
		Gid:           header.Gid,
	}, nil
}

// WindowsPath returns the file's RelPath with backslashes
// instead of forward slashes.
func (summary *FileSummary) WindowsPath() string {
	return strings.Replace(summary.RelPath, "/", "\\", -1)
}
