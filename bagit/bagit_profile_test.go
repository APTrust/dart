package bagit_test

import (
	"fmt"
	"github.com/APTrust/easy-store/bagit"
	"github.com/APTrust/easy-store/constants"
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
	aptrustFile, err := getPathToProfile("aptrust_bagit_profile_2.1.json")
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
	assert.Equal(t, "https://wiki.aptrust.org/APTrust_BagIt_Profile-2.1", profile.BagItProfileInfo.BagItProfileIdentifier)
	assert.Equal(t, "support@aptrust.org", profile.BagItProfileInfo.ContactEmail)
	assert.Equal(t, "A. Diamond", profile.BagItProfileInfo.ContactName)
	assert.Equal(t, "BagIt profile for ingesting content into APTrust.", profile.BagItProfileInfo.ExternalDescription)
	assert.Equal(t, "aptrust.org", profile.BagItProfileInfo.SourceOrganization)
	assert.Equal(t, "2.1", profile.BagItProfileInfo.Version)

	// Required Tag Files
	require.NotNil(t, profile.RequiredTags)
	require.Equal(t, 11, len(profile.RequiredTags))

	bagitRequiredTags := profile.TagsForFile("bagit.txt")
	require.NotNil(t, bagitRequiredTags)
	require.Equal(t, 2, len(bagitRequiredTags))
	bagItVersion := profile.FindTagDef("bagit.txt", "BagIt-Version")
	require.NotNil(t, bagItVersion)
	assert.True(t, bagItVersion.Required)
	assert.False(t, bagItVersion.EmptyOk)

	require.True(t, profile.RequiresTagFile("bag-info.txt"))
	require.True(t, profile.RequiresTagFile("aptrust-info.txt"))

	// Make sure tag labels were copied into tag definitions.
	for _, tagDef := range profile.TagsForFile("bagit.txt") {
		assert.NotEmpty(t, tagDef.TagName)
	}
	for _, tagDef := range profile.TagsForFile("bag-info.txt") {
		assert.NotEmpty(t, tagDef.TagName)
	}
	for _, tagDef := range profile.TagsForFile("aptrust-info.txt") {
		assert.NotEmpty(t, tagDef.TagName)
	}

	// Make sure this one parses, while we're at it.
	dpnFile, err := getPathToProfile("dpn_bagit_profile_2.1.json")
	require.Nil(t, err)
	dpnProfile, err := bagit.LoadBagItProfile(dpnFile)
	require.Nil(t, err)
	require.Equal(t, 22, len(dpnProfile.RequiredTags))
	require.Equal(t, 2, len(dpnProfile.TagsForFile("bagit.txt")))
	require.Equal(t, 9, len(dpnProfile.TagsForFile("bag-info.txt")))
	require.Equal(t, 11, len(dpnProfile.TagsForFile("dpn-tags/dpn-info.txt")))
}

func TestBagItProfileValidate(t *testing.T) {
	profile := &bagit.BagItProfile{}
	errs := profile.Validate()
	require.Equal(t, 4, len(errs))

	profile.AcceptBagItVersion = []string{"0.97"}
	profile.ManifestsRequired = []string{"md5"}
	tags := make([]*bagit.TagDefinition, 0)
	tags = append(tags, bagit.NewTagDefinition("bagit.txt", "BagIt-Version"))
	tags = append(tags, bagit.NewTagDefinition("bag-info.txt", "Payload-Oxum"))
	profile.RequiredTags = tags
	errs = profile.Validate()
	require.Equal(t, 0, len(errs))
}

func TestRequiredTagDirs(t *testing.T) {
	aptrustFile, err := getPathToProfile("aptrust_bagit_profile_2.1.json")
	require.Nil(t, err)
	aptrustProfile, err := bagit.LoadBagItProfile(aptrustFile)
	require.Nil(t, err)
	assert.Empty(t, aptrustProfile.RequiredTagDirs())

	dpnFile, err := getPathToProfile("dpn_bagit_profile_2.1.json")
	require.Nil(t, err)
	dpnProfile, err := bagit.LoadBagItProfile(dpnFile)
	require.Nil(t, err)
	require.Equal(t, 1, len(dpnProfile.RequiredTagDirs()))
	assert.Equal(t, "dpn-tags", dpnProfile.RequiredTagDirs()[0])
}

func TestSortedTagFilesRequired(t *testing.T) {
	aptrustFile, err := getPathToProfile("aptrust_bagit_profile_2.1.json")
	require.Nil(t, err)
	aptrustProfile, err := bagit.LoadBagItProfile(aptrustFile)
	require.Nil(t, err)
	expected := []string{"aptrust-info.txt", "bag-info.txt", "bagit.txt"}
	assert.Equal(t, expected, aptrustProfile.SortedTagFilesRequired())

	dpnFile, err := getPathToProfile("dpn_bagit_profile_2.1.json")
	require.Nil(t, err)
	dpnProfile, err := bagit.LoadBagItProfile(dpnFile)
	require.Nil(t, err)
	expected = []string{"bag-info.txt", "bagit.txt", "dpn-tags/dpn-info.txt"}
	assert.Equal(t, expected, dpnProfile.SortedTagFilesRequired())
}

func TestSortedTagNames(t *testing.T) {
	aptrustFile, err := getPathToProfile("aptrust_bagit_profile_2.1.json")
	require.Nil(t, err)
	aptrustProfile, err := bagit.LoadBagItProfile(aptrustFile)
	require.Nil(t, err)
	expected := []string{"Access", "Description", "Title"}
	assert.Equal(t, expected, aptrustProfile.SortedTagNames("aptrust-info.txt"))

	dpnFile, err := getPathToProfile("dpn_bagit_profile_2.1.json")
	require.Nil(t, err)
	dpnProfile, err := bagit.LoadBagItProfile(dpnFile)
	require.Nil(t, err)
	expected = []string{"Bag-Type", "DPN-Object-ID", "First-Version-Object-ID",
		"Ingest-Node-Address", "Ingest-Node-Contact-Email", "Ingest-Node-Contact-Name",
		"Ingest-Node-Name", "Interpretive-Object-ID", "Local-ID", "Rights-Object-ID",
		"Version-Number"}
	assert.Equal(t, expected, dpnProfile.SortedTagNames("dpn-tags/dpn-info.txt"))
}

func TestCanBeTarred(t *testing.T) {
	profile := &bagit.BagItProfile{}
	profile.AcceptSerialization = []string{"application/tar"}
	assert.True(t, profile.CanBeTarred())
	profile.AcceptSerialization = []string{"application/x-tar"}
	assert.True(t, profile.CanBeTarred())
	profile.AcceptSerialization = []string{"application/zip", "application/gzip"}
	assert.False(t, profile.CanBeTarred())
}

func TestMustBeTarred(t *testing.T) {
	profile := &bagit.BagItProfile{}
	profile.Serialization = constants.REQUIRED
	profile.AcceptSerialization = []string{"application/tar"}
	assert.True(t, profile.MustBeTarred())
	profile.AcceptSerialization = []string{"application/x-tar"}
	assert.True(t, profile.MustBeTarred())
	profile.AcceptSerialization = []string{"application/zip", "application/gzip"}
	assert.False(t, profile.MustBeTarred())

	profile.Serialization = constants.OPTIONAL
	profile.AcceptSerialization = []string{"application/tar"}
	assert.False(t, profile.MustBeTarred())
	profile.AcceptSerialization = []string{"application/x-tar"}
	assert.False(t, profile.MustBeTarred())
}
