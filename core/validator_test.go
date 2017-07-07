package core_test

import (
	"github.com/APTrust/bagit/core"
	"github.com/APTrust/bagit/util/testutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"strings"
	"testing"
)

func getValidator(t *testing.T, bagName, profileName string) *core.Validator {
	profilePath, err := testutil.GetPathToTestProfile(profileName)
	require.Nil(t, err)
	profile, err := core.LoadBagItProfile(profilePath)
	require.Nil(t, err)

	bagPath, err := testutil.GetPathToTestBag(bagName)
	require.Nil(t, err)
	bag := core.NewBag(bagPath)
	return core.NewValidator(bag, profile)
}

func TestNewValidator(t *testing.T) {
	validator := getValidator(t, "example.edu.tagsample_good.tar", "aptrust_bagit_profile_2.0.json")
	assert.NotNil(t, validator)
}

func TestReadBag(t *testing.T) {
	validator := getValidator(t, "example.edu.tagsample_good.tar", "aptrust_bagit_profile_2.0.json")
	require.NotNil(t, validator)
	validator.ReadBag()
	assert.Empty(t, validator.Errors())

	// Make sure files were added as the right types, in the right places.
	assert.Equal(t, 4, len(validator.Bag.Payload))
	assert.Equal(t, 2, len(validator.Bag.Manifests))
	assert.Equal(t, 2, len(validator.Bag.TagManifests))
	assert.Equal(t, 8, len(validator.Bag.TagFiles))

	assert.NotEmpty(t, validator.Bag.Payload["data/datastream-DC"])
	assert.NotEmpty(t, validator.Bag.Payload["data/datastream-descMetadata"])
	assert.NotEmpty(t, validator.Bag.Payload["data/datastream-MARC"])
	assert.NotEmpty(t, validator.Bag.Payload["data/datastream-RELS-EXT"])

	assert.NotEmpty(t, validator.Bag.Manifests["manifest-md5.txt"])
	assert.NotEmpty(t, validator.Bag.Manifests["manifest-sha256.txt"])

	assert.NotEmpty(t, validator.Bag.TagManifests["tagmanifest-md5.txt"])
	assert.NotEmpty(t, validator.Bag.TagManifests["tagmanifest-sha256.txt"])

	assert.NotEmpty(t, validator.Bag.TagFiles["aptrust-info.txt"])
	assert.NotEmpty(t, validator.Bag.TagFiles["bag-info.txt"])
	assert.NotEmpty(t, validator.Bag.TagFiles["bagit.txt"])
	assert.NotEmpty(t, validator.Bag.TagFiles["custom_tag_file.txt"])
	assert.NotEmpty(t, validator.Bag.TagFiles["junk_file.txt"])
	assert.NotEmpty(t, validator.Bag.TagFiles["custom_tags/tracked_file_custom.xml"])
	assert.NotEmpty(t, validator.Bag.TagFiles["custom_tags/tracked_tag_file.txt"])
	assert.NotEmpty(t, validator.Bag.TagFiles["custom_tags/untracked_tag_file.txt"])

	// Manifests should have been parsed.
	for _, m := range validator.Bag.Manifests {
		assert.Equal(t, 4, len(m.Checksums))
	}
	md5 := validator.Bag.Manifests["manifest-md5.txt"].Checksums["data/datastream-DC"]
	sha256 := validator.Bag.Manifests["manifest-sha256.txt"].Checksums["data/datastream-DC"]
	assert.Equal(t, "44d85cf4810d6c6fe87750117633e461", md5)
	assert.Equal(t, "248fac506a5c46b3c760312b99827b6fb5df4698d6cf9a9cdc4c54746728ab99", sha256)

	// TagManifests should have been parsed.
	for _, m := range validator.Bag.TagManifests {
		assert.Equal(t, 8, len(m.Checksums))
	}
	md5 = validator.Bag.TagManifests["tagmanifest-md5.txt"].Checksums["aptrust-info.txt"]
	sha256 = validator.Bag.TagManifests["tagmanifest-sha256.txt"].Checksums["aptrust-info.txt"]
	assert.Equal(t, "300e936e622605f9f7a846d261d53093", md5)
	assert.Equal(t, "a2b6c5a713af771c5e4edde8d5be25fbcad86e45ea338f43a5bb769347e7c8bb", sha256)

	// Files in BagItProfile.TagFilesRequired should be parsed,
	// while others should not.
	unparsedTagFile := validator.Bag.TagFiles["custom_tags/tracked_tag_file.txt"]
	assert.Empty(t, unparsedTagFile.Tags)

	parsedTagFile := validator.Bag.TagFiles["aptrust-info.txt"]
	require.NotEmpty(t, parsedTagFile.Tags)
	require.Equal(t, 1, len(parsedTagFile.Tags["Title"]))
	require.Equal(t, 1, len(parsedTagFile.Tags["Access"]))
	assert.Equal(t, "Thirteen Ways of Looking at a Blackbird", parsedTagFile.Tags["Title"][0])
	assert.Equal(t, "Institution", parsedTagFile.Tags["Access"][0])
}

func TestValidateTopLevelFiles(t *testing.T) {
	validator := getValidator(t, "example.edu.tagsample_good.tar", "aptrust_bagit_profile_2.0.json")
	require.NotNil(t, validator)

	validator.Profile.AllowMiscTopLevelFiles = true
	validator.ReadBag()
	ok := validator.ValidateTopLevelFiles()
	assert.True(t, ok)
	assert.Empty(t, validator.Errors())

	validator = getValidator(t, "example.edu.tagsample_good.tar", "aptrust_bagit_profile_2.0.json")
	require.NotNil(t, validator)

	// Items in the top-level dir that are not manifests or required
	// tag files are considered misc. The APTrust BagIt profile
	// defines 3 of the 5 non-manifest items in the top-level dir
	// as required (bagit, bag-info, aptrust-info), so the other two
	// are misc.
	validator.Profile.AllowMiscTopLevelFiles = false
	validator.ReadBag()
	ok = validator.ValidateTopLevelFiles()
	assert.False(t, ok)
	errs := validator.Errors()
	require.Equal(t, 2, len(errs))
	// These two may come back in different order.
	assert.True(t, strings.Contains(errs[0], "custom_tag_file.txt") ||
		strings.Contains(errs[0], "junk_file.txt"))
	assert.True(t, strings.Contains(errs[1], "custom_tag_file.txt") ||
		strings.Contains(errs[1], "junk_file.txt"))
}

func TestValidateBagItVersion(t *testing.T) {
	// Both profile and bag say version 0.97
	validator := getValidator(t, "example.edu.tagsample_good.tar", "aptrust_bagit_profile_2.0.json")
	require.NotNil(t, validator)
	validator.ReadBag()
	assert.True(t, validator.ValidateBagItVersion())
	assert.Empty(t, validator.Errors())

	// If no accepted versions are specified, then any version will do.
	validator = getValidator(t, "example.edu.tagsample_good.tar", "aptrust_bagit_profile_2.0.json")
	require.NotNil(t, validator)
	validator.Profile.AcceptBagItVersion = nil
	validator.ReadBag()
	assert.True(t, validator.ValidateBagItVersion())
	assert.Empty(t, validator.Errors())

	// Mismatch between accepted versions and actual version should
	// cause a validation error.
	validator = getValidator(t, "example.edu.tagsample_good.tar", "aptrust_bagit_profile_2.0.json")
	require.NotNil(t, validator)
	validator.Profile.AcceptBagItVersion = []string{"2.22", "3.33", "4.44"}
	validator.ReadBag()
	assert.False(t, validator.ValidateBagItVersion())
	require.Equal(t, 1, len(validator.Errors()))
	assert.Equal(t, "BagIt version 0.97 in bagit.txt does not match allowed version(s) 2.22,3.33,4.44", validator.Errors()[0])

	// Be specific about missing BagIt version
	validator = getValidator(t, "example.edu.tagsample_good.tar", "aptrust_bagit_profile_2.0.json")
	require.NotNil(t, validator)
	validator.ReadBag()
	delete(validator.Bag.TagFiles["bagit.txt"].Tags, "BagIt-Version")
	assert.False(t, validator.ValidateBagItVersion())
	require.Equal(t, 1, len(validator.Errors()))
	assert.Equal(t, "Profile requires a specific BagIt version, but no version is specified in bagit.txt", validator.Errors()[0])
}

func TestValidateAllowFetch(t *testing.T) {
	// fetch.txt not allowed and not present
	validator := getValidator(t, "example.edu.tagsample_good.tar", "aptrust_bagit_profile_2.0.json")
	require.NotNil(t, validator)
	validator.Profile.AllowFetchTxt = false
	assert.True(t, validator.ValidateAllowFetch())
	assert.Empty(t, validator.Errors())

	// Not allowed and present
	validator.Bag.TagFiles["fetch.txt"] = &core.File{}
	assert.False(t, validator.ValidateAllowFetch())
	require.NotEmpty(t, validator.Errors())
	assert.Equal(t, "Found fetch.txt, which BagIt profile says is not allowed.", validator.Errors()[0])

	// Allowed, but not present
	validator = getValidator(t, "example.edu.tagsample_good.tar", "aptrust_bagit_profile_2.0.json")
	require.NotNil(t, validator)
	validator.Profile.AllowFetchTxt = true
	assert.True(t, validator.ValidateAllowFetch())
	assert.Empty(t, validator.Errors())

	// Alloed and present
	validator.Bag.TagFiles["fetch.txt"] = &core.File{}
	assert.True(t, validator.ValidateAllowFetch())
	assert.Empty(t, validator.Errors())
}
