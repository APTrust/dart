package core

import (
	"fmt"
	"github.com/APTrust/bagit/constants"
	"github.com/APTrust/bagit/errtypes"
	"github.com/APTrust/bagit/util"
	"github.com/APTrust/bagit/util/fileutil"
	"io"
	"path/filepath"
	"strings"
)

type Validator struct {
	Bag         *Bag
	Profile     *BagItProfile
	errors      []string
	bagsize     int64
	payloadOxum string
}

func NewValidator(bag *Bag, profile *BagItProfile) *Validator {
	errs := make([]string, 0)
	return &Validator{
		Bag:     bag,
		Profile: profile,
		errors:  errs,
	}
}

func (validator *Validator) Validate() bool {
	if !validator.ValidateProfile() {
		return false
	}
	validator.ValidateSerialization()
	validator.ReadBag()
	validator.ValidateTopLevelFiles()
	validator.ValidateMiscDirs()
	validator.ValidateBagItVersion()
	validator.ValidateAllowFetch()
	validator.ValidateRequiredManifests()
	validator.ValidateTagFiles()
	validator.ValidateChecksums()
	return len(validator.errors) == 0
}

func (validator *Validator) ReadBag() {
	iterator, err := validator.getIterator()
	if err != nil {
		validator.addError("Error getting file iterator: %v", err)
		return
	}
	for {
		err := validator.processFile(iterator)
		if err != nil && (err == io.EOF || err.Error() == "EOF") {
			break // ReadIterator hit the end of the list
		} else if err != nil {
			validator.addError("Error reading bag: %s", err.Error())
			break
		}
	}
}

func (validator *Validator) processFile(iterator fileutil.ReadIterator) error {
	reader, fileSummary, err := iterator.Next()
	if reader != nil {
		defer reader.Close()
	} else {
		return errtypes.NewRuntimeError("Iterator returned a nil reader.")
	}
	if err != nil {
		return err
	}
	if !fileSummary.IsRegularFile {
		return nil // This is a directory
	}
	validator.Bag.AddFileFromSummary(fileSummary)
	return nil
}

// ValidateSerialization checks to whether the bag is serialized
// as a single file, or unserialized as a directory. If serialized,
// the file format should match one of the Accept-Serialization
// formats.
func (validator *Validator) ValidateSerialization() bool {
	ok := true
	serialization := strings.ToLower(validator.Profile.Serialization)
	isDir := fileutil.IsDir(validator.Bag.Path)
	isFile := fileutil.IsFile(validator.Bag.Path)
	if serialization == "required" && isDir {
		validator.addError("Serialization is required, but bag is a directory")
		ok = false
	}
	if isFile {
		if serialization == "forbidden" {
			validator.addError("Serialization is forbidden, but bag is a single file")
			ok = false
		} else {
			ok = validator.ValidateSerializationFormat()
		}
	}
	return ok
}

func (validator *Validator) ValidateSerializationFormat() bool {
	if validator.Profile.AcceptSerialization == nil {
		validator.addError("Bag is serialized, but profile does not specify accepted serializations")
		return false
	}
	extension := filepath.Base(validator.Bag.Path)
	mimeTypes, typeIsKnown := constants.SerializationFormats[extension]
	if typeIsKnown {
		validator.addError("Unknown serialization type for format %s", extension)
		return false
	}
	ok := false
	for _, accepted := range validator.Profile.AcceptSerialization {
		if util.StringListContains(mimeTypes, accepted) {
			ok = true
			break
		}
	}
	if !ok {
		validator.addError("Serialization format %s is not in the "+
			"Accept-Serialization list for this BagIt profile", extension)
	}
	return ok
}

func (validator *Validator) ValidateTopLevelFiles() bool {
	return true
}

func (validator *Validator) ValidateMiscDirs() bool {
	return true
}

func (validator *Validator) ValidateBagItVersion() bool {
	return true
}

func (validator *Validator) ValidateAllowFetch() (bool, error) {
	ok := true
	if !validator.Profile.AllowFetchTxt {
		iter, err := validator.getIterator()
		if err != nil {
			return false, err
		}
		fetchFile, err := iter.OpenFile("fetch.txt")
		defer fetchFile.Close()
		if fetchFile != nil && err == nil {
			validator.addError("Found fetch.txt, which BagIt profile says is not allowed.")
			ok = false
		}
	}
	return ok, nil
}

func (validator *Validator) ValidateRequiredManifests() bool {
	return true
}

func (validator *Validator) ValidateTagFiles() bool {
	return true
}

func (validator *Validator) ValidateChecksums() bool {
	return true
}

func (validator *Validator) ValidateProfile() bool {
	ok := true
	errs := validator.Profile.Validate()
	for _, err := range errs {
		validator.addError(err.Error())
		ok = false
	}
	return ok
}

// getIterator returns either a tar file iterator or a filesystem
// iterator, depending on whether we're reading a tarred bag or
// an untarred one.
func (validator *Validator) getIterator() (fileutil.ReadIterator, error) {
	if fileutil.IsDir(validator.Bag.Path) {
		return fileutil.NewFileSystemIterator(validator.Bag.Path)
	}
	ext := filepath.Ext(validator.Bag.Path)
	if ext == ".tar" {
		return fileutil.NewTarFileIterator(validator.Bag.Path)
	}
	// FUTURE: Support zip format
	return nil, fmt.Errorf("Cannot read bag format. Supported formats: directory, tar.")
}

// addError adds a message to the list of validation errors.
func (validator *Validator) addError(format string, a ...interface{}) {
	validator.errors = append(validator.errors, fmt.Sprintf(format, a...))
}
