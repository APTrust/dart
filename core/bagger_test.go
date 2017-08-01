package core_test

import (
	"github.com/APTrust/bagit/core"
	// "github.com/APTrust/bagit/util/fileutil"
	"github.com/APTrust/bagit/util/testutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"io/ioutil"
	"os"
	// "path/filepath"
	"strings"
	"testing"
)

var APTrustDefaultTags = map[string][]core.KeyValuePair{
	"bagit.txt": []core.KeyValuePair{
		core.NewKeyValuePair("BagIt-Version", "0.97"),
		core.NewKeyValuePair("Tag-File-Character-Encoding", "UTF-8"),
	},
	"bag-info.txt": []core.KeyValuePair{
		core.NewKeyValuePair("Source-Organization", "APTrust"),
	},
	"aptrust-info.txt": []core.KeyValuePair{
		core.NewKeyValuePair("Title", "Test Object"),
		core.NewKeyValuePair("Access", "Institution"),
	},
}

var DPNDefaultTags = map[string][]core.KeyValuePair{
	"bagit.txt": []core.KeyValuePair{
		core.NewKeyValuePair("BagIt-Version", "0.97"),
		core.NewKeyValuePair("Tag-File-Character-Encoding", "UTF-8"),
	},
	"bag-info.txt": []core.KeyValuePair{
		core.NewKeyValuePair("Source-Organization", "APTrust"),
		core.NewKeyValuePair("Organization-Address", "160 McCormick Rd, Charlottesville, VA 22904"),
		core.NewKeyValuePair("Contact-Email", "homer@example.com"),
		core.NewKeyValuePair("Bagging-Date", "2017-07-26"),
		core.NewKeyValuePair("Bag-Count", "1"),
		core.NewKeyValuePair("Contact-Name", "Homer Simpson"),
		core.NewKeyValuePair("Contact-Phone", "555-555-1212"),
		core.NewKeyValuePair("Bag-Size", "411"),
		core.NewKeyValuePair("Bag-Group-Identifier", "None"),
	},
	"dpn-tags/dpn-info.txt": []core.KeyValuePair{
		core.NewKeyValuePair("Ingest-Node-Name", "aptrust"),
		core.NewKeyValuePair("Ingest-Node-Contact-Name", "Apu Nahasapeemapetilon"),
		core.NewKeyValuePair("Ingest-Node-Contact-Email", "apu@example.com"),
		core.NewKeyValuePair("First-Version-Object-ID", "00af15fd-1046-4811-8cb5-878ec66cf0da"),
		core.NewKeyValuePair("Interpretive-Object-ID", "83bbc27a-86ef-4d1d-be09-4d78cf9e7df3"),
		core.NewKeyValuePair("Rights-Object-ID", "3559d615-6df9-4f30-a2b0-511568359787"),
		core.NewKeyValuePair("DPN-Object-ID", "00af15fd-1046-4811-8cb5-878ec66cf0da"),
		core.NewKeyValuePair("Local-ID", "Homer's Beer Can Collection"),
		core.NewKeyValuePair("Ingest-Node-Address", "160 McCormick Rd, Charlottesville, VA 22904"),
		core.NewKeyValuePair("Version-Number", "1"),
		core.NewKeyValuePair("Bag-Type", "data"),
	},
}

func getBaggerPreReqs(t *testing.T) (tempDir string, aptrustProfile *core.BagItProfile) {
	tempDir, err := ioutil.TempDir("", "bagger_test")
	require.Nil(t, err)

	profilePath, err := testutil.GetPathToTestProfile("aptrust_bagit_profile_2.0.json")
	require.Nil(t, err)
	aptrustProfile, err = core.LoadBagItProfile(profilePath)
	require.Nil(t, err)

	return tempDir, aptrustProfile
}

func countItems(items map[string][]core.KeyValuePair) int {
	count := 0
	for _, list := range items {
		count += len(list)
	}
	return count
}

func TestNewBagger(t *testing.T) {
	tempDir, aptrustProfile := getBaggerPreReqs(t)
	defer os.RemoveAll(tempDir)

	bagger, err := core.NewBagger("", aptrustProfile)
	require.NotNil(t, err)
	assert.Equal(t, "Param bagPath cannot be empty", err.Error())

	bagger, err = core.NewBagger(tempDir, nil)
	require.NotNil(t, err)
	assert.Equal(t, "Param profile cannot be nil", err.Error())

	bagger, err = core.NewBagger(tempDir, aptrustProfile)
	require.Nil(t, err)
	require.NotNil(t, bagger)
	require.NotNil(t, bagger.Bag())
	require.NotNil(t, bagger.Profile())
}

func TestHasRequiredTags(t *testing.T) {
	tempDir, aptrustProfile := getBaggerPreReqs(t)
	defer os.RemoveAll(tempDir)

	// Make sure we flag missing required APTrust tags
	bagger, err := core.NewBagger(tempDir, aptrustProfile)
	require.Nil(t, err)
	require.NotNil(t, bagger)

	assert.False(t, bagger.WriteBag(true, true))
	errors := bagger.Errors()
	require.NotEmpty(t, errors)
	require.Equal(t, countItems(APTrustDefaultTags), len(errors))

	for _, list := range APTrustDefaultTags {
		for _, kvPair := range list {
			foundError := false
			for _, err := range errors {
				if strings.Contains(err, kvPair.Key) {
					foundError = true
				}
			}
			assert.True(t, foundError, "Bagger did not flag missing tag %s", kvPair.Key)
		}
	}

	// Make sure there are no errors when tags are all there
	for filename, list := range APTrustDefaultTags {
		for _, kvPair := range list {
			bagger.AddTag(filename, &kvPair)
		}
	}
	assert.True(t, bagger.WriteBag(true, true))
	errors = bagger.Errors()
	require.Empty(t, errors)

	// Make sure bagger flags missing required DPN tags
	profilePath, err := testutil.GetPathToTestProfile("dpn_bagit_profile.json")
	require.Nil(t, err)
	dpnProfile, err := core.LoadBagItProfile(profilePath)
	require.Nil(t, err)

	bagger, err = core.NewBagger(tempDir, dpnProfile)
	require.Nil(t, err)
	require.NotNil(t, bagger)

	assert.False(t, bagger.WriteBag(true, true))
	errors = bagger.Errors()
	require.NotEmpty(t, errors)
	require.Equal(t, countItems(DPNDefaultTags), len(errors))

	for _, list := range DPNDefaultTags {
		for _, kvPair := range list {
			foundError := false
			for _, err := range errors {
				if strings.Contains(err, kvPair.Key) {
					foundError = true
				}
			}
			assert.True(t, foundError, "Bagger did not flag missing tag %s", kvPair.Key)
		}
	}

	// Make sure there are no errors when tags are all there
	for filename, list := range DPNDefaultTags {
		for _, kvPair := range list {
			bagger.AddTag(filename, &kvPair)
		}
	}
	assert.True(t, bagger.WriteBag(true, true))
	errors = bagger.Errors()
	require.Empty(t, errors)

}

// func TestBuildBag(t *testing.T) {
// 	tempFile, payloadDir, aptrustProfile := getBaggerPreReqs(t)
// 	dir := filepath.Dir(tempFile.Name())
// 	tempFile.Close()
// 	os.Remove(filepath.Dir(tempFile.Name()))

// 	bagger := core.NewBagger(dir, payloadDir, aptrustProfile, APTrustDefaultTags, true)
// 	require.NotNil(t, bagger)

// 	assert.True(t, bagger.BuildBag())
// 	require.Empty(t, bagger.Errors())
// 	files, err := fileutil.RecursiveFileList(dir)
// 	require.Nil(t, err)
// 	assert.Equal(t, 6, len(files))

// 	require.NotNil(t, bagger.Bag)
// 	require.NotNil(t, bagger.Bag.Manifests)

// 	md5 := bagger.Bag.Manifests["manifest-md5.txt"]
// 	require.NotNil(t, md5)

// 	assert.Equal(t, "6385e86c8489b28586d03320efd57dfe", md5.Checksums["data/hemingway.jpg"])
// 	assert.Equal(t, "c3b41207c1374fa0bc2c2d323afc580d", md5.Checksums["data/lighthouse.jpg"])
// 	assert.Equal(t, "a41052eecd987d8175164c48f486945c", md5.Checksums["data/president.jpg"])
// 	assert.Equal(t, "8ee0d735f4120b06de6ba8a9a4047336", md5.Checksums["data/sample.docx"])
// 	assert.Equal(t, "12dae6491cc10bd8d088b70852a39e2c", md5.Checksums["data/sample.pdf"])
// 	assert.Equal(t, "3585ab45da8cdfdcec64f8b6460c763f", md5.Checksums["data/sample.txt"])
// }
