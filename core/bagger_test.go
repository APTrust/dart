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

var APTrustDefaultTags = map[string]string{
	"BagIt-Version":               "0.97",
	"Tag-File-Character-Encoding": "UTF-8",
	"Source-Organization":         "APTrust",
	"Title":                       "Test Object",
	"Access":                      "Institution",
}

var DPNDefaultTags = map[string]string{
	"BagIt-Version":               "0.97",
	"Tag-File-Character-Encoding": "UTF-8",
	"Contact-Name":                "Homer Simpson",
	"Contact-Phone":               "555-555-1212",
	"Bag-Size":                    "411",
	"Bag-Group-Identifier":        "None",
	"Source-Organization":         "APTrust",
	"Organization-Address":        "160 McCormick Rd, Charlottesville, VA 22904",
	"Contact-Email":               "homer@example.com",
	"Bagging-Date":                "2017-07-26",
	"Bag-Count":                   "1",
	"Ingest-Node-Name":            "aptrust",
	"Ingest-Node-Contact-Name":    "Apu Nahasapeemapetilon",
	"Ingest-Node-Contact-Email":   "apu@example.com",
	"First-Version-Object-ID":     "00af15fd-1046-4811-8cb5-878ec66cf0da",
	"Interpretive-Object-ID":      "83bbc27a-86ef-4d1d-be09-4d78cf9e7df3",
	"Rights-Object-ID":            "3559d615-6df9-4f30-a2b0-511568359787",
	"DPN-Object-ID":               "00af15fd-1046-4811-8cb5-878ec66cf0da",
	"Local-ID":                    "Homer's Beer Can Collection",
	"Ingest-Node-Address":         "160 McCormick Rd, Charlottesville, VA 22904",
	"Version-Number":              "1",
	"Bag-Type":                    "data",
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
	require.Equal(t, len(APTrustDefaultTags), len(errors))

	for tagName, _ := range APTrustDefaultTags {
		foundError := false
		for _, err := range errors {
			if strings.Contains(err, tagName) {
				foundError = true
			}
		}
		assert.True(t, foundError, "Bagger did not flag missing tag %s", tagName)
	}

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
	require.Equal(t, len(DPNDefaultTags), len(errors))

	for tagName, _ := range DPNDefaultTags {
		foundError := false
		for _, err := range errors {
			if strings.Contains(err, tagName) {
				foundError = true
			}
		}
		assert.True(t, foundError, "Bagger did not flag missing tag %s", tagName)
	}
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
