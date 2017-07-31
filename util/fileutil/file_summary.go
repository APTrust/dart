package fileutil

import (
	"archive/tar"
	"fmt"
	"github.com/APTrust/bagit/util/platform"
	"os"
	"strings"
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
	return &FileSummary{
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
