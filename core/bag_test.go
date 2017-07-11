package core_test

import (
	"github.com/APTrust/bagit/constants"
	"github.com/APTrust/bagit/core"
	"github.com/APTrust/bagit/util"
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

	file, fileType := bag.AddFileFromSummary(fileSummary("tagmanifest-sha256.txt"))
	assert.NotNil(t, file)
	assert.Equal(t, constants.MANIFEST, fileType)
	assert.Equal(t, 1, len(bag.TagManifests))
	assert.NotNil(t, 1, bag.TagManifests["tagmanifest-sha256.txt"])

	file, fileType = bag.AddFileFromSummary(fileSummary("manifest-sha256.txt"))
	assert.NotNil(t, file)
	assert.Equal(t, constants.MANIFEST, fileType)
	assert.Equal(t, 1, len(bag.Manifests))
	assert.NotNil(t, 1, bag.Manifests["manifest-sha256.txt"])

	file, fileType = bag.AddFileFromSummary(fileSummary("data/photo.jpg"))
	assert.NotNil(t, file)
	assert.Equal(t, constants.PAYLOAD_FILE, fileType)
	assert.Equal(t, 1, len(bag.Payload))
	assert.NotNil(t, 1, bag.Payload["data/photo.jpg"])

	file, fileType = bag.AddFileFromSummary(fileSummary("aptrust-info.txt"))
	assert.NotNil(t, file)
	assert.Equal(t, constants.TAG_FILE, fileType)
	assert.Equal(t, 1, len(bag.TagFiles))
	assert.NotNil(t, 1, bag.TagFiles["aptrust-info.txt"])

	file, fileType = bag.AddFileFromSummary(fileSummary("extra/random_file.xml"))
	assert.NotNil(t, file)
	assert.Equal(t, constants.TAG_FILE, fileType)
	assert.Equal(t, 2, len(bag.TagFiles))
	assert.NotNil(t, 2, bag.TagFiles["extra/random_file.xml"])
}

func TestGetChecksumFromManifest(t *testing.T) {
	bag := core.NewBag("path/to/bag.tar")
	require.NotNil(t, bag)
	bag.Manifests["manifest-md5.txt"] = core.NewFile(int64(344))
	bag.Manifests["manifest-md5.txt"].ParsedData.Append("data/sample.txt", "12345678")
	bag.Manifests["manifest-sha256.txt"] = core.NewFile(int64(377))
	bag.Manifests["manifest-sha256.txt"].ParsedData.Append("data/sample.txt", "fedac8989")

	checksum, err := bag.GetChecksumFromManifest(constants.MD5, "data/sample.txt")
	assert.Nil(t, err)
	assert.Equal(t, "12345678", checksum)

	checksum, err = bag.GetChecksumFromManifest(constants.SHA256, "data/sample.txt")
	assert.Nil(t, err)
	assert.Equal(t, "fedac8989", checksum)

	// Sha256 manifest exists, but has no record of requested file
	checksum, err = bag.GetChecksumFromManifest(constants.SHA256, "data/file_does_not_exist.txt")
	assert.Nil(t, err)
	assert.Equal(t, "", checksum)

	// No sha512 manifest. Error.
	checksum, err = bag.GetChecksumFromManifest(constants.SHA512, "data/sample.txt")
	assert.NotNil(t, err)
	assert.Equal(t, "", checksum)
}

func TestGetChecksumFromTagManifest(t *testing.T) {
	bag := core.NewBag("path/to/bag.tar")
	require.NotNil(t, bag)
	bag.TagManifests["tagmanifest-md5.txt"] = core.NewFile(int64(344))
	bag.TagManifests["tagmanifest-md5.txt"].ParsedData.Append("bag-info.txt", "12345678")
	bag.TagManifests["tagmanifest-sha256.txt"] = core.NewFile(int64(377))
	bag.TagManifests["tagmanifest-sha256.txt"].ParsedData.Append("bag-info.txt", "fedac8989")

	checksum, err := bag.GetChecksumFromTagManifest(constants.MD5, "bag-info.txt")
	assert.Nil(t, err)
	assert.Equal(t, "12345678", checksum)

	checksum, err = bag.GetChecksumFromTagManifest(constants.SHA256, "bag-info.txt")
	assert.Nil(t, err)
	assert.Equal(t, "fedac8989", checksum)

	// Sha256 tag manifest exists, but has no record of requested file
	checksum, err = bag.GetChecksumFromTagManifest(constants.SHA256, "file_does_not_exist.txt")
	assert.Nil(t, err)
	assert.Equal(t, "", checksum)

	// No sha512 tag manifest. Error.
	checksum, err = bag.GetChecksumFromTagManifest(constants.SHA512, "sample.txt")
	assert.NotNil(t, err)
	assert.Equal(t, "", checksum)
}

func TestGetTagValues(t *testing.T) {
	bag := core.NewBag("path/to/bag.tar")
	require.NotNil(t, bag)

	bag.TagFiles["aptrust-info.txt"] = core.NewFile(int64(344))
	bag.TagFiles["aptrust-info.txt"].ParsedData.Append("key1", "value1")
	bag.TagFiles["dpn-tags/dpn-info.txt"] = core.NewFile(int64(344))
	bag.TagFiles["dpn-tags/dpn-info.txt"].ParsedData.Append("key1", "value2")

	values, tagExists := bag.GetTagValues("key1")
	assert.True(t, tagExists)
	require.Equal(t, 2, len(values))
	assert.True(t, util.StringListContains(values, "value1"))
	assert.True(t, util.StringListContains(values, "value2"))

	values, tagExists = bag.GetTagValues("key9")
	assert.False(t, tagExists)
	assert.Empty(t, values)
}

func TestGetTagValuesFromFile(t *testing.T) {
	bag := core.NewBag("path/to/bag.tar")
	require.NotNil(t, bag)

	bag.TagFiles["aptrust-info.txt"] = core.NewFile(int64(344))
	bag.TagFiles["aptrust-info.txt"].ParsedData.Append("key1", "value1")
	bag.TagFiles["dpn-tags/dpn-info.txt"] = core.NewFile(int64(344))
	bag.TagFiles["dpn-tags/dpn-info.txt"].ParsedData.Append("key1", "value2")

	values, tagExists, err := bag.GetTagValuesFromFile("aptrust-info.txt", "key1")
	assert.True(t, tagExists)
	assert.Nil(t, err)
	require.Equal(t, 1, len(values))
	assert.True(t, util.StringListContains(values, "value1"))

	values, tagExists, err = bag.GetTagValuesFromFile("dpn-tags/dpn-info.txt", "key1")
	assert.True(t, tagExists)
	assert.Nil(t, err)
	require.Equal(t, 1, len(values))
	assert.True(t, util.StringListContains(values, "value2"))

	values, tagExists, err = bag.GetTagValuesFromFile("dpn-tags/dpn-info.txt", "no-such-tag")
	assert.Nil(t, err)
	assert.False(t, tagExists)
	assert.Empty(t, values)

	values, tagExists, err = bag.GetTagValuesFromFile("no-such-file.txt", "key1")
	assert.NotNil(t, err)
	assert.False(t, tagExists)
	assert.Empty(t, values)
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
