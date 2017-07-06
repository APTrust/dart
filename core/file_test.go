package core_test

import (
	"github.com/APTrust/bagit/core"
	"github.com/APTrust/bagit/util/fileutil"
	"github.com/APTrust/bagit/util/testutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestParseAsTagFile(t *testing.T) {
	bagPath, err := testutil.GetPathToTestBag("example.edu.tagsample_good.tar")
	require.Nil(t, err)
	tfi, err := fileutil.NewTarFileIterator(bagPath)
	require.NotNil(t, tfi)

	reader, err := tfi.OpenFile("example.edu.tagsample_good/aptrust-info.txt")
	defer reader.Close()
	require.Nil(t, err)

	file := &core.File{}
	errs := file.ParseAsTagFile(reader, "example.edu.tagsample_good/aptrust-info.txt")
	assert.Empty(t, errs)
	assert.Equal(t, 2, len(file.Tags))
	require.NotEmpty(t, file.Tags["Title"])
	require.NotEmpty(t, file.Tags["Access"])
	assert.Equal(t, "Thirteen Ways of Looking at a Blackbird", file.Tags["Title"][0])
	assert.Equal(t, "Institution", file.Tags["Access"][0])

	reader2, err := tfi.OpenFile("example.edu.tagsample_good/bag-info.txt")
	defer reader.Close()
	require.Nil(t, err)

	file = &core.File{}
	errs = file.ParseAsTagFile(reader2, "example.edu.tagsample_good/bag-info.txt")
	assert.Empty(t, errs)
	assert.Equal(t, 6, len(file.Tags))

	require.NotEmpty(t, file.Tags["Source-Organization"])
	require.NotEmpty(t, file.Tags["Bagging-Date"])
	require.NotEmpty(t, file.Tags["Bag-Count"])
	require.NotEmpty(t, file.Tags["Bag-Group-Identifier"])
	require.NotEmpty(t, file.Tags["Internal-Sender-Description"])
	require.NotEmpty(t, file.Tags["Internal-Sender-Identifier"])

	assert.Equal(t, "virginia.edu", file.Tags["Source-Organization"][0])
	assert.Equal(t, "2014-04-14T11:55:26.17-0400", file.Tags["Bagging-Date"][0])
	assert.Equal(t, "1 of 1", file.Tags["Bag-Count"][0])
	assert.Equal(t, "Charley Horse", file.Tags["Bag-Group-Identifier"][0])
	assert.Equal(t, "so much depends upon a red wheel barrow glazed with rain water beside the white chickens", file.Tags["Internal-Sender-Description"][0])
	assert.Equal(t, "uva-internal-id-0001", file.Tags["Internal-Sender-Identifier"][0])
}

func TestParseAsManifest(t *testing.T) {

}
