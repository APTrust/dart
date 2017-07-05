package core_test

import (
	"github.com/APTrust/bagit/core"
	"github.com/APTrust/bagit/util/fileutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"testing"
	"time"
)

func TestNewBag(t *testing.T) {
	bag := core.NewBag("path/to/bag.tar")
	require.NotNil(t, bag)
	assert.Equal(t, "path/to/bag.tar", bag.Path)
	assert.NotNil(t, bag.Payload)
	assert.NotNil(t, bag.Manifests)
	assert.NotNil(t, bag.TagManifests)
	assert.NotNil(t, bag.TagFiles)
}

func TestAddFileFromSummary(t *testing.T) {
	bag := core.NewBag("path/to/bag.tar")
	require.NotNil(t, bag)

	bag.AddFileFromSummary(fileSummary("tagmanifest-sha256.txt"))
	assert.Equal(t, 1, len(bag.TagManifests))
	assert.NotNil(t, 1, bag.TagManifests["tagmanifest-sha256.txt"])

	bag.AddFileFromSummary(fileSummary("manifest-sha256.txt"))
	assert.Equal(t, 1, len(bag.Manifests))
	assert.NotNil(t, 1, bag.Manifests["manifest-sha256.txt"])

	bag.AddFileFromSummary(fileSummary("data/photo.jpg"))
	assert.Equal(t, 1, len(bag.Payload))
	assert.NotNil(t, 1, bag.Payload["data/photo.jpg"])

	bag.AddFileFromSummary(fileSummary("extra/random_file.xml"))
	assert.Equal(t, 1, len(bag.TagFiles))
	assert.NotNil(t, 1, bag.TagFiles["extra/random_file.xml"])
}

func fileSummary(relPath string) *fileutil.FileSummary {
	return &fileutil.FileSummary{
		RelPath:       relPath,
		Mode:          0644,
		Size:          int64(9000),
		ModTime:       time.Now().UTC(),
		IsDir:         false,
		IsRegularFile: true,
		Uid:           1000,
		Gid:           1000,
	}
}
