package bagit_test

import (
	"github.com/APTrust/easy-store/bagit"
	"github.com/APTrust/easy-store/util/fileutil"
	"github.com/APTrust/easy-store/util/testutil"
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

	file := &bagit.File{}
	errs := file.ParseAsTagFile(reader, "example.edu.tagsample_good/aptrust-info.txt")
	assert.Empty(t, errs)
	assert.Equal(t, 2, file.ParsedData.Count())
	require.NotEmpty(t, file.ParsedData.FindByKey("Title"))
	require.NotEmpty(t, file.ParsedData.FindByKey("Access"))
	assert.Equal(t, "Thirteen Ways of Looking at a Blackbird", file.ParsedData.FindByKey("Title")[0].Value)
	assert.Equal(t, "Institution", file.ParsedData.FindByKey("Access")[0].Value)

	reader2, err := tfi.OpenFile("example.edu.tagsample_good/bag-info.txt")
	defer reader.Close()
	require.Nil(t, err)

	file = &bagit.File{}
	errs = file.ParseAsTagFile(reader2, "example.edu.tagsample_good/bag-info.txt")
	assert.Empty(t, errs)
	assert.Equal(t, 6, file.ParsedData.Count())

	require.NotEmpty(t, file.ParsedData.FindByKey("Source-Organization"))
	require.NotEmpty(t, file.ParsedData.FindByKey("Bagging-Date"))
	require.NotEmpty(t, file.ParsedData.FindByKey("Bag-Count"))
	require.NotEmpty(t, file.ParsedData.FindByKey("Bag-Group-Identifier"))
	require.NotEmpty(t, file.ParsedData.FindByKey("Internal-Sender-Description"))
	require.NotEmpty(t, file.ParsedData.FindByKey("Internal-Sender-Identifier"))

	assert.Equal(t, "virginia.edu", file.ParsedData.FindByKey("Source-Organization")[0].Value)
	assert.Equal(t, "2014-04-14T11:55:26.17-0400", file.ParsedData.FindByKey("Bagging-Date")[0].Value)
	assert.Equal(t, "1 of 1", file.ParsedData.FindByKey("Bag-Count")[0].Value)
	assert.Equal(t, "Charley Horse", file.ParsedData.FindByKey("Bag-Group-Identifier")[0].Value)
	assert.Equal(t, "so much depends upon a red wheel barrow glazed with rain water beside the white chickens", file.ParsedData.FindByKey("Internal-Sender-Description")[0].Value)
	assert.Equal(t, "uva-internal-id-0001", file.ParsedData.FindByKey("Internal-Sender-Identifier")[0].Value)
}

func TestParseAsManifest(t *testing.T) {
	bagPath, err := testutil.GetPathToTestBag("example.edu.tagsample_good.tar")
	require.Nil(t, err)
	tfi, err := fileutil.NewTarFileIterator(bagPath)
	require.NotNil(t, tfi)

	reader, err := tfi.OpenFile("example.edu.tagsample_good/manifest-md5.txt")
	defer reader.Close()
	require.Nil(t, err)

	file := &bagit.File{}
	errs := file.ParseAsManifest(reader, "example.edu.tagsample_good/manifest-md5.txt")
	assert.Empty(t, errs)
	assert.Equal(t, 4, file.ParsedData.Count())
	assert.Equal(t, "44d85cf4810d6c6fe87750117633e461", file.ParsedData.FirstValueForKey("data/datastream-DC"))
	assert.Equal(t, "4bd0ad5f85c00ce84a455466b24c8960", file.ParsedData.FirstValueForKey("data/datastream-descMetadata"))
	assert.Equal(t, "93e381dfa9ad0086dbe3b92e0324bae6", file.ParsedData.FirstValueForKey("data/datastream-MARC"))
	assert.Equal(t, "ff731b9a1758618f6cc22538dede6174", file.ParsedData.FirstValueForKey("data/datastream-RELS-EXT"))
}
