package core

import (
	"fmt"
	"github.com/APTrust/bagit/constants"
	"github.com/APTrust/bagit/util/fileutil"
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
	file := NewFile(fileSummary.Size)
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

// GetChecksum returns the checksum with the specified algorithm
// for the specified file. Param filePath should be the relative
// path of the file within the bag. For example, "data/image.jpg".
// If filePath does not begin with "data/", this will look for
// the checksum in the tag manifest. Otherwise, it checks the
// payload manifest. Param algorithm should be "md5", "sha256", or any
// other manifest algorithm. This returns the checksum, or an error if
// no manifest file exists for the specified checksum.
func (bag *Bag) GetChecksum(filePath, algorighm string) (string, error) {
	return "", nil
}

// GetTagValues returns the values for the specified tag from any and
// all parsed tag files. Returns the tag values, which may be an empty
// slice, and a boolean indicating whether the tag is present in any
// of the parsed tag files.
func (bag *Bag) GetTagValues(tagName string) ([]string, bool) {
	tagIsPresent := false
	values := make([]string, 0)
	for _, tagFile := range bag.TagFiles {
		vals := tagFile.Tags[tagName]
		if vals != nil {
			tagIsPresent = true
			// This slice may be empty
			for _, val := range vals {
				values = append(values, val)
			}
		}
	}
	return values, tagIsPresent
}

// GetTagValuesFromFile returns the values of the specified tag from
// the specified tag file. This returns an error if the specified
// tag file does not exist. Param filePath should be the relative
// path of the tag file within the bag. E.g. "aptrust-info.txt"
// or "dpn-tags/dpn-info.txt". The bool return value indicates whether
// the tag was present in any tag files.
func (bag *Bag) GetTagValuesFromFile(filePath, tagName string) ([]string, bool, error) {
	tagIsPresent := false
	tagFile := bag.TagFiles[filePath]
	if tagFile == nil {
		return nil, tagIsPresent, fmt.Errorf("Tag file %s is not in bag", filePath)
	}
	values := tagFile.Tags[tagName]
	tagIsPresent = values != nil
	if !tagIsPresent {
		values = make([]string, 0)
	}
	return values, tagIsPresent, nil
}
