package bagit

import (
	"fmt"
	"github.com/APTrust/easy-store/constants"
	"github.com/APTrust/easy-store/util/fileutil"
	"sort"
	"strings"
)

type Bag struct {
	Path         string
	Payload      map[string]*File
	Manifests    map[string]*File
	TagManifests map[string]*File
	TagFiles     map[string]*File
}

func NewBag(filePath string) *Bag {
	return &Bag{
		Path:         filePath,
		Payload:      make(map[string]*File),
		Manifests:    make(map[string]*File),
		TagManifests: make(map[string]*File),
		TagFiles:     make(map[string]*File),
	}
}

// AddFileFromSummary adds a file to the bag and returns the File
// record and the type of the file. FileTypes are defined in constants.go.
func (bag *Bag) AddFileFromSummary(fileSummary *fileutil.FileSummary) (*File, string) {
	fileType := constants.PAYLOAD_FILE
	file := NewFile(fileSummary)
	if strings.HasPrefix(fileSummary.RelPath, "tagmanifest-") {
		bag.TagManifests[fileSummary.RelPath] = file
		fileType = constants.MANIFEST
	} else if strings.HasPrefix(fileSummary.RelPath, "manifest-") {
		bag.Manifests[fileSummary.RelPath] = file
		fileType = constants.MANIFEST
	} else if strings.HasPrefix(fileSummary.RelPath, "data/") {
		bag.Payload[fileSummary.RelPath] = file
	} else {
		bag.TagFiles[fileSummary.RelPath] = file
		fileType = constants.TAG_FILE
	}
	return file, fileType
}

// GetChecksumFromManifest returns the checksum with the specified algorithm
// for the specified file. Param algorithm should be "md5", "sha256", or any
// other manifest algorithm. This returns the checksum, or an error if
// no manifest file exists for the specified checksum.
// Param filePath should be the relative  path of the file within the bag.
// For example, "data/image.jpg". If filePath does not begin with "data/",
// this will look for the checksum in the tag manifest. Otherwise, it checks
// the payload manifest.
func (bag *Bag) GetChecksumFromManifest(algorithm, filePath string) (string, error) {
	manifestFile := fmt.Sprintf("manifest-%s.txt", algorithm)
	if bag.Manifests[manifestFile] == nil {
		return "", fmt.Errorf("%s is missing", manifestFile)
	}
	checksum := bag.Manifests[manifestFile].ParsedData.FirstValueForKey(filePath)
	return checksum, nil
}

// GetChecksumFromTagManifest returns the checksum with the specified algorithm
// for the specified file. Param algorithm should be "md5", "sha256", or any
// other manifest algorithm. This returns the checksum, or an error if
// no manifest file exists for the specified checksum.
// Param filePath should be the relative  path of the file within the bag.
// For example, "data/image.jpg". If filePath does not begin with "data/",
// this will look for the checksum in the tag manifest. Otherwise, it checks
// the payload manifest.
func (bag *Bag) GetChecksumFromTagManifest(algorithm, filePath string) (string, error) {
	manifestFile := fmt.Sprintf("tagmanifest-%s.txt", algorithm)
	if bag.TagManifests[manifestFile] == nil {
		return "", fmt.Errorf("%s is missing", manifestFile)
	}
	checksum := ""
	checksums := bag.TagManifests[manifestFile].ParsedData.ValuesForKey(filePath)
	if len(checksums) > 0 {
		checksum = checksums[0]
	}
	return checksum, nil
}

// GetTagValues returns the values for the specified tag from any and
// all parsed tag files. Returns the tag values, which may be an empty
// slice.
func (bag *Bag) GetTagValues(tagName string) (values []string, tagIsPresent bool, hasNonEmptyValue bool) {
	values = make([]string, 0)
	for _, tagFile := range bag.TagFiles {
		vals := tagFile.ParsedData.FindByKey(tagName)
		if vals != nil && len(vals) > 0 {
			// This slice may be empty
			tagIsPresent = true
			for _, val := range vals {
				values = append(values, val.Value)
				if val.Value != "" {
					hasNonEmptyValue = true
				}
			}
		}
	}
	return values, tagIsPresent, hasNonEmptyValue
}

// GetTagValuesFromFile returns the values of the specified tag from
// the specified tag file. This returns an error if the specified
// tag file does not exist. Param filePath should be the relative
// path of the tag file within the bag. E.g. "aptrust-info.txt"
// or "dpn-tags/dpn-info.txt".
func (bag *Bag) GetTagValuesFromFile(filePath, tagName string) (values []string, tagIsPresent bool, hasNonEmptyValue bool, err error) {
	tagFile := bag.TagFiles[filePath]
	if tagFile == nil {
		return nil, false, false, fmt.Errorf("Tag file %s is not in bag", filePath)
	}
	keyValuePairs := tagFile.ParsedData.FindByKey(tagName)
	values = make([]string, len(keyValuePairs))
	for i, item := range keyValuePairs {
		values[i] = item.Value
		tagIsPresent = true
		if item.Value != "" {
			hasNonEmptyValue = true
		}
	}
	return values, tagIsPresent, hasNonEmptyValue, nil
}

// AddChecksumsToManifest adds all of the payload file checksums
// to each manifest.
func (bag *Bag) AddChecksumsToManifests() {
	sortedFiles := bag.sortKeys(bag.Payload)
	for manifestName, manifest := range bag.Manifests {
		// Reset this on each call, so duplicate calls don't
		// result in duplicate entries.
		manifest.ParsedData = NewKeyValueCollection()
		_, alg := fileutil.ParseManifestName(manifestName)
		for _, fileName := range sortedFiles {
			file := bag.Payload[fileName]
			manifest.ParsedData.Append(fileName, file.Checksums[alg])
		}
	}
}

// AddChecksumsToManifest adds all of the tag file checksums
// to each tagmanifest. Call this after AddChecksumsToManifests,
// so that the checksums of the payload manifests will be available.
func (bag *Bag) AddChecksumsToTagManifests() {
	sortedManifests := bag.sortKeys(bag.Manifests)
	sortedTagFiles := bag.sortKeys(bag.TagFiles)
	for manifestName, manifest := range bag.TagManifests {
		// Reset this on each call, so duplicate calls don't
		// result in duplicate entries.
		manifest.ParsedData = NewKeyValueCollection()
		_, alg := fileutil.ParseManifestName(manifestName)
		for _, fileName := range sortedManifests {
			file := bag.Manifests[fileName]
			manifest.ParsedData.Append(fileName, file.Checksums[alg])
		}
		for _, fileName := range sortedTagFiles {
			file := bag.TagFiles[fileName]
			manifest.ParsedData.Append(fileName, file.Checksums[alg])
		}
	}
}

// sortKeys returns the string keys of a map in sorted order.
func (bag *Bag) sortKeys(items map[string]*File) []string {
	keys := make([]string, len(items))
	i := 0
	for key, _ := range items {
		keys[i] = key
		i++
	}
	sort.Strings(keys)
	return keys
}
