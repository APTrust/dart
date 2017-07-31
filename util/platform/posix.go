// +build !windows

package platform

import (
	"os"
	"syscall"
)

// A late addition. Allows us to build apt_validate on all platforms.
func FileOwnerAndGroup(finfo os.FileInfo) (uid int, gid int) {
	systat := finfo.Sys().(*syscall.Stat_t)
	if systat != nil {
		uid = int(systat.Uid)
		gid = int(systat.Gid)
	}
	return uid, gid
}
