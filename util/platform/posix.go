// +build !windows

package platform

import (
	"archive/tar"
	"os"
	"syscall"
)

// We have a dummy version of this call in posix.go.
// Windows does not implement the syscall.Stat_t type we
// need, but the *nixes do. We use this in util.AddToArchive
// to set owner/group on files being added to a tar archive.
func GetOwnerAndGroup(finfo os.FileInfo, header *tar.Header) {
	uid, gid := FileOwnerAndGroup(finfo)
	header.Uid = uid
	header.Gid = gid
}

// A late addition. Allows us to build apt_validate on all platforms.
func FileOwnerAndGroup(finfo os.FileInfo) (uid int, gid int) {
	systat := finfo.Sys().(*syscall.Stat_t)
	if systat != nil {
		uid = int(systat.Uid)
		gid = int(systat.Gid)
	}
	return uid, gid
}
