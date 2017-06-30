package core_test

import (
	//	"fmt"
	"github.com/APTrust/bagit/core"
	"github.com/APTrust/bagit/util/testutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
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

}
