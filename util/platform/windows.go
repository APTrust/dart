// +build windows

package platform

import (
	"os"
)

// A late addition. Allows us to build apt_validate on all platforms.
func FileOwnerAndGroup(finfo os.FileInfo) (uid int, gid int) {
	return uid, gid // will be 0,0
}
