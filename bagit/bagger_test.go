package bagit_test

import (
	"fmt"
	"github.com/APTrust/easy-store/bagit"
	"github.com/APTrust/easy-store/constants"
	"github.com/APTrust/easy-store/util/fileutil"
	"github.com/APTrust/easy-store/util/testutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

var APTrustDefaultTags = map[string][]bagit.KeyValuePair{
	"bagit.txt": []bagit.KeyValuePair{
		bagit.NewKeyValuePair("BagIt-Version", "0.97"),
		bagit.NewKeyValuePair("Tag-File-Character-Encoding", "UTF-8"),
	},
	"bag-info.txt": []bagit.KeyValuePair{
		bagit.NewKeyValuePair("Source-Organization", "APTrust"),
	},
	"aptrust-info.txt": []bagit.KeyValuePair{
		bagit.NewKeyValuePair("Title", "Test Object"),
		bagit.NewKeyValuePair("Access", "Institution"),
	},
}

var DPNDefaultTags = map[string][]bagit.KeyValuePair{
	"bagit.txt": []bagit.KeyValuePair{
		bagit.NewKeyValuePair("BagIt-Version", "0.97"),
		bagit.NewKeyValuePair("Tag-File-Character-Encoding", "UTF-8"),
	},
	"bag-info.txt": []bagit.KeyValuePair{
		bagit.NewKeyValuePair("Source-Organization", "APTrust"),
		bagit.NewKeyValuePair("Organization-Address", "160 McCormick Rd, Charlottesville, VA 22904"),
		bagit.NewKeyValuePair("Contact-Email", "homer@example.com"),
		bagit.NewKeyValuePair("Bagging-Date", "2017-07-26"),
		bagit.NewKeyValuePair("Bag-Count", "1"),
		bagit.NewKeyValuePair("Contact-Name", "Homer Simpson"),
		bagit.NewKeyValuePair("Contact-Phone", "555-555-1212"),
		bagit.NewKeyValuePair("Bag-Size", "411"),
		bagit.NewKeyValuePair("Bag-Group-Identifier", "None"),
	},
	"dpn-tags/dpn-info.txt": []bagit.KeyValuePair{
		bagit.NewKeyValuePair("Ingest-Node-Name", "aptrust"),
		bagit.NewKeyValuePair("Ingest-Node-Contact-Name", "Apu Nahasapeemapetilon"),
		bagit.NewKeyValuePair("Ingest-Node-Contact-Email", "apu@example.com"),
		bagit.NewKeyValuePair("First-Version-Object-ID", "00af15fd-1046-4811-8cb5-878ec66cf0da"),
		bagit.NewKeyValuePair("Interpretive-Object-ID", "83bbc27a-86ef-4d1d-be09-4d78cf9e7df3"),
		bagit.NewKeyValuePair("Rights-Object-ID", "3559d615-6df9-4f30-a2b0-511568359787"),
		bagit.NewKeyValuePair("DPN-Object-ID", "00af15fd-1046-4811-8cb5-878ec66cf0da"),
		bagit.NewKeyValuePair("Local-ID", "Homer's Beer Can Collection"),
		bagit.NewKeyValuePair("Ingest-Node-Address", "160 McCormick Rd, Charlottesville, VA 22904"),
		bagit.NewKeyValuePair("Version-Number", "1"),
		bagit.NewKeyValuePair("Bag-Type", "data"),
	},
}

func getBaggerPreReqs(t *testing.T) (tempDir string, aptrustProfile *bagit.BagItProfile) {
	tempDir, err := ioutil.TempDir("", "bagger_test")
	require.Nil(t, err)

	profilePath, err := testutil.GetPathToTestProfile("aptrust_bagit_profile_2.1.json")
	require.Nil(t, err)
	aptrustProfile, err = bagit.LoadBagItProfile(profilePath)
	require.Nil(t, err)

	return tempDir, aptrustProfile
}

func countItems(items map[string][]bagit.KeyValuePair) int {
	count := 0
	for _, list := range items {
		count += len(list)
	}
	return count
}

func TestNewBagger(t *testing.T) {
	tempDir, aptrustProfile := getBaggerPreReqs(t)
	defer os.RemoveAll(tempDir)

	bagger, err := bagit.NewBagger("", aptrustProfile)
	require.NotNil(t, err)
	assert.Equal(t, "Param bagPath cannot be empty", err.Error())

	bagger, err = bagit.NewBagger(tempDir, nil)
	require.NotNil(t, err)
	assert.Equal(t, "Param profile cannot be nil", err.Error())

	bagger, err = bagit.NewBagger(tempDir, aptrustProfile)
	require.Nil(t, err)
	require.NotNil(t, bagger)
	require.NotNil(t, bagger.Bag())
	require.NotNil(t, bagger.Profile())
}

func TestHasRequiredTags(t *testing.T) {
	tempDir, aptrustProfile := getBaggerPreReqs(t)
	defer os.RemoveAll(tempDir)

	// Make sure we flag missing required APTrust tags
	bagger, err := bagit.NewBagger(tempDir, aptrustProfile)
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
	profilePath, err := testutil.GetPathToTestProfile("dpn_bagit_profile_2.1.json")
	require.Nil(t, err)
	dpnProfile, err := bagit.LoadBagItProfile(profilePath)
	require.Nil(t, err)

	bagger, err = bagit.NewBagger(tempDir, dpnProfile)
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

func TestWriteBag_APTrust(t *testing.T) {
	tempDir, aptrustProfile := getBaggerPreReqs(t)
	os.RemoveAll(tempDir)

	bagger, err := bagit.NewBagger(tempDir, aptrustProfile)
	require.Nil(t, err)
	require.NotNil(t, bagger)

	// Add tags
	for filename, list := range APTrustDefaultTags {
		for _, kvPair := range list {
			bagger.AddTag(filename, &kvPair)
		}
	}

	// Add files. The "files" var contains relative file paths.
	testFileDir, _ := testutil.GetPathToTestFileDir()
	absSourcePath, _ := fileutil.RecursiveFileList(testFileDir)
	relDestPaths := make([]string, len(absSourcePath))
	for i, absSrcPath := range absSourcePath {
		// Use forward slash, even on Windows, for path of file inside bag
		relDestPath := fmt.Sprintf("data/%s", filepath.Base(absSrcPath))
		bagger.AddFile(absSrcPath, relDestPath)
		relDestPaths[i] = relDestPath
	}

	assert.True(t, bagger.WriteBag(true, true))
	require.Empty(t, bagger.Errors())
	filesWritten, err := fileutil.RecursiveFileList(tempDir)
	require.Nil(t, err)

	// Make sure the files were written to disk
	relDestPaths = append(relDestPaths, "bagit.txt", "bag-info.txt", "aptrust-info.txt", "manifest-md5.txt")
	assert.Equal(t, len(relDestPaths), len(filesWritten))
	for _, relPath := range relDestPaths {
		absDestPath := filepath.Join(tempDir, relPath)
		assert.True(t, fileutil.FileExists(absDestPath))
	}

	// Make sure the checksums were loaded into the manifest.
	bag := bagger.Bag()
	require.NotNil(t, bag)
	require.NotNil(t, bag.Manifests)

	md5 := bag.Manifests["manifest-md5.txt"]
	require.NotNil(t, md5)

	checksum, _ := bag.GetChecksumFromManifest(constants.MD5, "data/hemingway.jpg")
	assert.Equal(t, "6385e86c8489b28586d03320efd57dfe", checksum)

	checksum, _ = bag.GetChecksumFromManifest(constants.MD5, "data/lighthouse.jpg")
	assert.Equal(t, "c3b41207c1374fa0bc2c2d323afc580d", checksum)

	checksum, _ = bag.GetChecksumFromManifest(constants.MD5, "data/president.jpg")
	assert.Equal(t, "a41052eecd987d8175164c48f486945c", checksum)

	checksum, _ = bag.GetChecksumFromManifest(constants.MD5, "data/sample.docx")
	assert.Equal(t, "8ee0d735f4120b06de6ba8a9a4047336", checksum)

	checksum, _ = bag.GetChecksumFromManifest(constants.MD5, "data/sample.pdf")
	assert.Equal(t, "12dae6491cc10bd8d088b70852a39e2c", checksum)

	checksum, _ = bag.GetChecksumFromManifest(constants.MD5, "data/sample.txt")
	assert.Equal(t, "3585ab45da8cdfdcec64f8b6460c763f", checksum)

	// Verify contents of tag files and the manifest.
	expectedBagit := "BagIt-Version:  0.97\nTag-File-Character-Encoding:  UTF-8\n"
	expectedBagInfo := "Source-Organization:  APTrust\nPayload-Oxum:  632046.6\n"
	expectedAPTrustInfo := "Title:  Test Object\nAccess:  Institution\n"
	expectedManifest := `6385e86c8489b28586d03320efd57dfe data/hemingway.jpg
c3b41207c1374fa0bc2c2d323afc580d data/lighthouse.jpg
a41052eecd987d8175164c48f486945c data/president.jpg
8ee0d735f4120b06de6ba8a9a4047336 data/sample.docx
12dae6491cc10bd8d088b70852a39e2c data/sample.pdf
3585ab45da8cdfdcec64f8b6460c763f data/sample.txt
`

	actualBagit, err := ioutil.ReadFile(filepath.Join(tempDir, "bagit.txt"))
	require.Nil(t, err)
	require.Equal(t, expectedBagit, string(actualBagit))

	actualBagInfo, err := ioutil.ReadFile(filepath.Join(tempDir, "bag-info.txt"))
	require.Nil(t, err)
	require.Equal(t, expectedBagInfo, string(actualBagInfo))

	actualAPTrustInfo, err := ioutil.ReadFile(filepath.Join(tempDir, "aptrust-info.txt"))
	require.Nil(t, err)
	require.Equal(t, expectedAPTrustInfo, string(actualAPTrustInfo))

	actualManifest, err := ioutil.ReadFile(filepath.Join(tempDir, "manifest-md5.txt"))
	require.Nil(t, err)
	require.Equal(t, expectedManifest, string(actualManifest))
}

func TestWriteBag_DPN(t *testing.T) {
	// Get a tmp dir name
	tempDir, err := ioutil.TempDir("", "bagger_test")
	require.Nil(t, err)

	// Load the DPN bagit profile
	profilePath, err := testutil.GetPathToTestProfile("dpn_bagit_profile_2.1.json")
	require.Nil(t, err)
	dpnProfile, err := bagit.LoadBagItProfile(profilePath)
	require.Nil(t, err)

	// Get our bagger
	bagger, err := bagit.NewBagger(tempDir, dpnProfile)
	require.Nil(t, err)
	require.NotNil(t, bagger)

	// Add tags
	for filename, list := range DPNDefaultTags {
		for _, kvPair := range list {
			bagger.AddTag(filename, &kvPair)
		}
	}

	// Add files. The "files" var contains relative file paths.
	testFileDir, _ := testutil.GetPathToTestFileDir()
	absSourcePath, _ := fileutil.RecursiveFileList(testFileDir)
	relDestPaths := make([]string, len(absSourcePath))
	for i, absSrcPath := range absSourcePath {
		// Use forward slash, even on Windows, for path of file inside bag
		relDestPath := fmt.Sprintf("data/%s", filepath.Base(absSrcPath))
		bagger.AddFile(absSrcPath, relDestPath)
		relDestPaths[i] = relDestPath
	}

	assert.True(t, bagger.WriteBag(true, true))
	require.Empty(t, bagger.Errors())
	filesWritten, err := fileutil.RecursiveFileList(tempDir)
	require.Nil(t, err)

	// Make sure the files were written to disk
	relDestPaths = append(relDestPaths, "bagit.txt", "bag-info.txt",
		"dpn-tags/dpn-info.txt", "manifest-sha256.txt", "tagmanifest-sha256.txt")
	assert.Equal(t, len(relDestPaths), len(filesWritten))
	for _, relPath := range relDestPaths {
		absDestPath := filepath.Join(tempDir, relPath)
		assert.True(t, fileutil.FileExists(absDestPath))
	}

	// Make sure the checksums were loaded into the manifest.
	bag := bagger.Bag()
	require.NotNil(t, bag)
	require.NotNil(t, bag.Manifests)

	sha256 := bag.Manifests["manifest-sha256.txt"]
	require.NotNil(t, sha256)

	checksum, _ := bag.GetChecksumFromManifest(constants.SHA256, "data/hemingway.jpg")
	assert.Equal(t, "01d46064cdd20c943a1ceb09d523dddb052e52d7f7c0fd53cc928dfe6d6e0dd5", checksum)

	checksum, _ = bag.GetChecksumFromManifest(constants.SHA256, "data/lighthouse.jpg")
	assert.Equal(t, "66363a6b2c64a5560d7cf17f3e39545320e888968f1bcef99dde732671415c44", checksum)

	checksum, _ = bag.GetChecksumFromManifest(constants.SHA256, "data/president.jpg")
	assert.Equal(t, "a0dea3fd2e3f565c610f9a1b48bdbb0303d855090c230ac849b62c48267704de", checksum)

	checksum, _ = bag.GetChecksumFromManifest(constants.SHA256, "data/sample.docx")
	assert.Equal(t, "ac90bd87d53b9ab8d24f2cdbdf36721c4e1021ade78c7f16997ceec105c303eb", checksum)

	checksum, _ = bag.GetChecksumFromManifest(constants.SHA256, "data/sample.pdf")
	assert.Equal(t, "1a728e9068020801cdbf24d2ba4b359459a7c415ddb43a98c43e33f6373ee4fe", checksum)

	checksum, _ = bag.GetChecksumFromManifest(constants.SHA256, "data/sample.txt")
	assert.Equal(t, "c7346cc676d1721ac50e5b66a5ce54549d839e6deff92220fd9f233f4c5cefa4", checksum)

	// Verify contents of tag files and the manifest.
	expectedBagit := "BagIt-Version:  0.97\nTag-File-Character-Encoding:  UTF-8\n"
	expectedBagInfo := `Source-Organization:  APTrust
Organization-Address:  160 McCormick Rd, Charlottesville, VA 22904
Contact-Email:  homer@example.com
Bagging-Date:  2017-07-26
Bag-Count:  1
Contact-Name:  Homer Simpson
Contact-Phone:  555-555-1212
Bag-Size:  411
Bag-Group-Identifier:  None
Payload-Oxum:  632046.6
`
	expectedDPNInfo := `Ingest-Node-Name:  aptrust
Ingest-Node-Contact-Name:  Apu Nahasapeemapetilon
Ingest-Node-Contact-Email:  apu@example.com
First-Version-Object-ID:  00af15fd-1046-4811-8cb5-878ec66cf0da
Interpretive-Object-ID:  83bbc27a-86ef-4d1d-be09-4d78cf9e7df3
Rights-Object-ID:  3559d615-6df9-4f30-a2b0-511568359787
DPN-Object-ID:  00af15fd-1046-4811-8cb5-878ec66cf0da
Local-ID:  Homer's Beer Can Collection
Ingest-Node-Address:  160 McCormick Rd, Charlottesville, VA 22904
Version-Number:  1
Bag-Type:  data
`
	expectedManifest := `01d46064cdd20c943a1ceb09d523dddb052e52d7f7c0fd53cc928dfe6d6e0dd5 data/hemingway.jpg
66363a6b2c64a5560d7cf17f3e39545320e888968f1bcef99dde732671415c44 data/lighthouse.jpg
a0dea3fd2e3f565c610f9a1b48bdbb0303d855090c230ac849b62c48267704de data/president.jpg
ac90bd87d53b9ab8d24f2cdbdf36721c4e1021ade78c7f16997ceec105c303eb data/sample.docx
1a728e9068020801cdbf24d2ba4b359459a7c415ddb43a98c43e33f6373ee4fe data/sample.pdf
c7346cc676d1721ac50e5b66a5ce54549d839e6deff92220fd9f233f4c5cefa4 data/sample.txt
`
	expectedTagManifest := `f7745fbcab89c3ec2b570b3d9ffd14c7201df609891d50f0d98b232d49531a19 manifest-sha256.txt
ff21b499d8843e7450007c3b60a7b1657d4c9ff8bd0d6c5b62d791eb76d6a617 bag-info.txt
49b477e8662d591f49fce44ca5fc7bfe76c5a71f69c85c8d91952a538393e5f4 bagit.txt
ad841d4fd1c40c44d19f6b960f1cde6f73962c290bbaf41e77274fe2852b0887 dpn-tags/dpn-info.txt
`

	actualBagit, err := ioutil.ReadFile(filepath.Join(tempDir, "bagit.txt"))
	require.Nil(t, err)
	require.Equal(t, expectedBagit, string(actualBagit))

	actualBagInfo, err := ioutil.ReadFile(filepath.Join(tempDir, "bag-info.txt"))
	require.Nil(t, err)
	require.Equal(t, expectedBagInfo, string(actualBagInfo))

	actualDPNInfo, err := ioutil.ReadFile(filepath.Join(tempDir, "dpn-tags/dpn-info.txt"))
	require.Nil(t, err)
	require.Equal(t, expectedDPNInfo, string(actualDPNInfo))

	actualManifest, err := ioutil.ReadFile(filepath.Join(tempDir, "manifest-sha256.txt"))
	require.Nil(t, err)
	require.Equal(t, expectedManifest, string(actualManifest))

	actualTagManifest, err := ioutil.ReadFile(filepath.Join(tempDir, "tagmanifest-sha256.txt"))
	require.Nil(t, err)
	require.Equal(t, expectedTagManifest, string(actualTagManifest))
}

func TestPayloadOxum(t *testing.T) {
	// Get a tmp dir name
	tempDir, err := ioutil.TempDir("", "bagger_test")
	require.Nil(t, err)

	// Load the DPN bagit profile
	profilePath, err := testutil.GetPathToTestProfile("dpn_bagit_profile_2.1.json")
	require.Nil(t, err)
	dpnProfile, err := bagit.LoadBagItProfile(profilePath)
	require.Nil(t, err)

	// Get our bagger
	bagger, err := bagit.NewBagger(tempDir, dpnProfile)
	require.Nil(t, err)
	require.NotNil(t, bagger)

	// Add files. The "files" var contains relative file paths.
	testFileDir, _ := testutil.GetPathToTestFileDir()
	absSourcePath, _ := fileutil.RecursiveFileList(testFileDir)
	relDestPaths := make([]string, len(absSourcePath))
	for i, absSrcPath := range absSourcePath {
		// Use forward slash, even on Windows, for path of file inside bag
		relDestPath := fmt.Sprintf("data/%s", filepath.Base(absSrcPath))
		bagger.AddFile(absSrcPath, relDestPath)
		relDestPaths[i] = relDestPath
	}

	// Check the Oxum value. 6 files, approx. 632kb
	assert.Equal(t, "632046.6", bagger.GetPayloadOxum())
}

func TestWriteBagToTarFile_APTrust(t *testing.T) {
	tempDir, aptrustProfile := getBaggerPreReqs(t)
	defer os.RemoveAll(tempDir)

	tarFilePath := filepath.Join(tempDir, "aptrust_test_bag.tar")
	bagger, err := bagit.NewBagger(tarFilePath, aptrustProfile)
	require.Nil(t, err)
	require.NotNil(t, bagger)

	// Add tags
	for filename, list := range APTrustDefaultTags {
		for _, kvPair := range list {
			bagger.AddTag(filename, &kvPair)
		}
	}

	// Add files. The "files" var contains relative file paths.
	testFileDir, _ := testutil.GetPathToTestFileDir()
	absSourcePath, _ := fileutil.RecursiveFileList(testFileDir)
	relDestPaths := make([]string, len(absSourcePath))
	for i, absSrcPath := range absSourcePath {
		// Use forward slash, even on Windows, for path of file inside bag
		relDestPath := fmt.Sprintf("data/%s", filepath.Base(absSrcPath))
		bagger.AddFile(absSrcPath, relDestPath)
		relDestPaths[i] = relDestPath
	}

	assert.True(t, bagger.WriteBagToTarFile(true, true))
	require.Empty(t, bagger.Errors())

	// Not a pure unit test, since we're relying on another code module here,
	// but it's pretty thorough.
	bag := bagit.NewBag(tarFilePath)
	validator := bagit.NewValidator(bag, aptrustProfile)
	assert.True(t, validator.Validate())
	errors := validator.Errors()
	require.Empty(t, errors)

	bagInfo := bag.TagFiles["bag-info.txt"]
	require.NotNil(t, bagInfo)
	oxum := bagInfo.ParsedData.FirstValueForKey("Payload-Oxum")
	assert.Equal(t, "632046.6", oxum)
}

func TestWriteBagToTarFile_DPN(t *testing.T) {
	tempDir, _ := getBaggerPreReqs(t)
	defer os.RemoveAll(tempDir)

	// Load the DPN bagit profile
	profilePath, err := testutil.GetPathToTestProfile("dpn_bagit_profile_2.1.json")
	require.Nil(t, err)
	dpnProfile, err := bagit.LoadBagItProfile(profilePath)
	require.Nil(t, err)

	tarFilePath := filepath.Join(tempDir, "dpn_test_bag.tar")
	bagger, err := bagit.NewBagger(tarFilePath, dpnProfile)
	require.Nil(t, err)
	require.NotNil(t, bagger)

	// Add tags
	for filename, list := range DPNDefaultTags {
		for _, kvPair := range list {
			bagger.AddTag(filename, &kvPair)
		}
	}

	// Add files. The "files" var contains relative file paths.
	testFileDir, _ := testutil.GetPathToTestFileDir()
	absSourcePath, _ := fileutil.RecursiveFileList(testFileDir)
	relDestPaths := make([]string, len(absSourcePath))
	for i, absSrcPath := range absSourcePath {
		// Use forward slash, even on Windows, for path of file inside bag
		relDestPath := fmt.Sprintf("data/%s", filepath.Base(absSrcPath))
		bagger.AddFile(absSrcPath, relDestPath)
		relDestPaths[i] = relDestPath
	}

	assert.True(t, bagger.WriteBagToTarFile(true, true))
	require.Empty(t, bagger.Errors())

	// Not a pure unit test, since we're relying on another code module here,
	// but it's pretty thorough.
	bag := bagit.NewBag(tarFilePath)
	validator := bagit.NewValidator(bag, dpnProfile)
	assert.True(t, validator.Validate())
	errors := validator.Errors()
	require.Empty(t, errors)

	bagInfo := bag.TagFiles["bag-info.txt"]
	require.NotNil(t, bagInfo)
	oxum := bagInfo.ParsedData.FirstValueForKey("Payload-Oxum")
	assert.Equal(t, "632046.6", oxum)
}
