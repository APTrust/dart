package testutil_test

import (
	"github.com/APTrust/bagit/util/testutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"strings"
	"testing"
)

func TestGetPathToTestData(t *testing.T) {
	path, err := testutil.GetPathToTestData()
	require.Nil(t, err)
	assert.True(t, strings.HasSuffix(path, "/bagit/testdata"))
}

func TestGetPathToTestBag(t *testing.T) {
	path, err := testutil.GetPathToTestBag("example.edu.tagsample_good.tar")
	require.Nil(t, err)
	assert.True(t, strings.HasSuffix(path, "/bagit/testdata/bags/example.edu.tagsample_good.tar"))
}

func TestGetPathToTestProfile(t *testing.T) {
	path, err := testutil.GetPathToTestProfile("dpn_bagit_profile.json")
	require.Nil(t, err)
	assert.True(t, strings.HasSuffix(path, "/bagit/testdata/profiles/dpn_bagit_profile.json"))
}
