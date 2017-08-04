package bagit_test

import (
	"fmt"
	"github.com/APTrust/easy-store/bagit"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"path/filepath"
	"runtime"
	"testing"
)

func getPathToProfile(profileName string) (string, error) {
	_, filename, _, ok := runtime.Caller(0)
	if !ok {
		return "", fmt.Errorf("Rumtime cannot get caller file name.")
	}
	absFileName, err := filepath.Abs(filename)
	if err != nil {
		return "", err
	}
	bagPath := filepath.Join(absFileName, "..", "..", "testdata", "profiles", profileName)
	return filepath.Abs(bagPath)
}

func TestLoadBagItProfile(t *testing.T) {
	aptrustFile, err := getPathToProfile("aptrust_bagit_profile_2.0.json")
	require.Nil(t, err)
	profile, err := bagit.LoadBagItProfile(aptrustFile)
	require.Nil(t, err)
	assert.EqualValues(t, []string{"0.97"}, profile.AcceptBagItVersion)
	assert.EqualValues(t, []string{"application/tar"}, profile.AcceptSerialization)
	assert.False(t, profile.AllowFetchTxt)
	assert.True(t, profile.AllowMiscTopLevelFiles)
	assert.True(t, profile.AllowMiscDirectories)
	assert.EqualValues(t, []string{"md5"}, profile.ManifestsRequired)
	assert.Equal(t, "required", profile.Serialization)
	assert.Empty(t, profile.TagManifestsRequired)

	// BagIt Profile Info
	require.NotNil(t, profile.BagItProfileInfo)
	assert.Equal(t, "http://example.com/aptrust-bagit-profile_2.0.json", profile.BagItProfileInfo.BagItProfileIdentifier)
	assert.Equal(t, "support@aptrust.org", profile.BagItProfileInfo.ContactEmail)
	assert.Equal(t, "A. Diamond", profile.BagItProfileInfo.ContactName)
	assert.Equal(t, "BagIt profile for ingesting content into APTrust.", profile.BagItProfileInfo.ExternalDescription)
	assert.Equal(t, "aptrust.org", profile.BagItProfileInfo.SourceOrganization)
	assert.Equal(t, "2.0", profile.BagItProfileInfo.Version)

	// Required Tag Files
	require.NotNil(t, profile.TagFilesRequired)
	require.Equal(t, 3, len(profile.TagFilesRequired))

	bagitRequiredTags := profile.TagFilesRequired["bagit.txt"]
	require.NotNil(t, bagitRequiredTags)
	require.Equal(t, 2, len(bagitRequiredTags))
	require.NotNil(t, bagitRequiredTags["BagIt-Version"])
	assert.True(t, bagitRequiredTags["BagIt-Version"].Required)
	assert.False(t, bagitRequiredTags["BagIt-Version"].EmptyOk)

	baginfo := profile.TagFilesRequired["bag-info.txt"]
	require.NotNil(t, baginfo)

	aptrust := profile.TagFilesRequired["aptrust-info.txt"]
	require.NotNil(t, aptrust)

	// Make sure tag labels were copied into tag definitions.
	for _, tagDef := range bagitRequiredTags {
		assert.NotEmpty(t, tagDef.Label)
	}
	for _, tagDef := range baginfo {
		assert.NotEmpty(t, tagDef.Label)
	}
	for _, tagDef := range aptrust {
		assert.NotEmpty(t, tagDef.Label)
	}

	// Make sure this one parses, while we're at it.
	dpnFile, err := getPathToProfile("dpn_bagit_profile.json")
	require.Nil(t, err)
	dpnProfile, err := bagit.LoadBagItProfile(dpnFile)
	require.Nil(t, err)
	require.Equal(t, 3, len(dpnProfile.TagFilesRequired))
	require.Equal(t, 2, len(dpnProfile.TagFilesRequired["bagit.txt"]))
	require.Equal(t, 9, len(dpnProfile.TagFilesRequired["bag-info.txt"]))
	require.Equal(t, 11, len(dpnProfile.TagFilesRequired["dpn-tags/dpn-info.txt"]))
}

func TestBagItProfileValidate(t *testing.T) {
	profile := &bagit.BagItProfile{}
	errs := profile.Validate()
	require.Equal(t, 4, len(errs))

	profile.AcceptBagItVersion = []string{"0.97"}
	profile.ManifestsRequired = []string{"md5"}
	profile.TagFilesRequired = make(map[string]map[string]*bagit.TagDefinition)
	profile.TagFilesRequired["bagit.txt"] = make(map[string]*bagit.TagDefinition)
	profile.TagFilesRequired["bagit.txt"]["tag1"] = &bagit.TagDefinition{}
	profile.TagFilesRequired["bag-info.txt"] = make(map[string]*bagit.TagDefinition)
	profile.TagFilesRequired["bag-info.txt"]["tag2"] = &bagit.TagDefinition{}
	errs = profile.Validate()
	require.Equal(t, 0, len(errs))
}

func TestRequiredTagDirs(t *testing.T) {
	aptrustFile, err := getPathToProfile("aptrust_bagit_profile_2.0.json")
	require.Nil(t, err)
	aptrustProfile, err := bagit.LoadBagItProfile(aptrustFile)
	require.Nil(t, err)
	assert.Empty(t, aptrustProfile.RequiredTagDirs())

	dpnFile, err := getPathToProfile("dpn_bagit_profile.json")
	require.Nil(t, err)
	dpnProfile, err := bagit.LoadBagItProfile(dpnFile)
	require.Nil(t, err)
	require.Equal(t, 1, len(dpnProfile.RequiredTagDirs()))
	assert.Equal(t, "dpn-tags", dpnProfile.RequiredTagDirs()[0])
}
