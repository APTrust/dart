package fileutil_test

import (
	"archive/tar"
	"github.com/APTrust/bagit/util/fileutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"testing"
	"time"
)

func TestNewFileSummaryFromPath(t *testing.T) {

}

func TestNewFileSummaryFromTarHeader(t *testing.T) {
	modTime, _ := time.Parse(time.RFC3339, "2017-07-31T15:33:00+00:00")
	accessTime, _ := time.Parse(time.RFC3339, "2017-07-31T15:38:21+00:00")
	changeTime, _ := time.Parse(time.RFC3339, "2017-07-31T15:34:12+00:00")
	tarHeader := &tar.Header{
		Name:       "my_bag_o_goodies/data/image.jpg",
		Mode:       int64(0755),
		Uid:        1001,
		Gid:        501,
		Size:       int64(8800),
		ModTime:    modTime,
		Typeflag:   tar.TypeReg,
		Linkname:   "",
		Uname:      "aptrust",
		Gname:      "users",
		Devmajor:   int64(1),
		Devminor:   int64(6),
		AccessTime: accessTime,
		ChangeTime: changeTime,
		Xattrs:     nil,
	}
	fs, err := fileutil.NewFileSummaryFromTarHeader(tarHeader, "my_bag_o_goodies/")
	require.Nil(t, err)
	require.NotNil(t, fs)
	assert.Equal(t, "data/image.jpg", fs.RelPath)
	assert.EqualValues(t, int64(0755), fs.Mode)
	assert.Equal(t, int64(8800), fs.Size)
	assert.Equal(t, modTime, fs.ModTime)
	assert.False(t, fs.IsDir)
	assert.True(t, fs.IsRegularFile)
	assert.Equal(t, 1001, fs.Uid)
	assert.Equal(t, 501, fs.Gid)
}
