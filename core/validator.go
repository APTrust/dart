package core

import (
	"fmt"
	"github.com/APTrust/bagit/constants"
	"github.com/APTrust/bagit/errtypes"
	"github.com/APTrust/bagit/util"
	"github.com/APTrust/bagit/util/fileutil"
	"io"
	"os"
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
	validator.ValidateManifests()
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

// processFile adds file information to the Payload, Manifests, TagManifests,
// and TagFiles properties of validator.Bag.
func (validator *Validator) processFile(iterator fileutil.ReadIterator) error {
	// Get the next file from the bag.
	reader, fileSummary, err := iterator.Next()
	if reader != nil {
		defer reader.Close()
	}
	if err != nil {
		return err
	}
	if !fileSummary.IsRegularFile {
		return nil // This is a directory. Don't process it.
	}

	// Add that file to our representation of the bag.
	file, fileType := validator.Bag.AddFileFromSummary(fileSummary)

	// Parse the file if it's a manifest or required tag file.
	var errs []error
	if fileType == constants.MANIFEST {
		errs = file.ParseAsManifest(reader, fileSummary.RelPath)
	} else if fileType == constants.TAG_FILE && validator.Profile.TagFilesRequired[fileSummary.RelPath] != nil {
		errs = file.ParseAsTagFile(reader, fileSummary.RelPath)
	}

	// Record parse errors
	for _, err := range errs {
		validator.addError(err.Error())
	}

	// Return an error if there was one, so we break out of
	// the validation loop above.
	if len(errs) > 0 {
		return fmt.Errorf("Error(s) in manifest or tag file.")
	}
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

// ValidateTopLevelFiles returns false if the BagIt profile says
// AllowMiscTopLevelFiles is false and the bag contains files in the
// top-level directory that are neither manifests nor tag manifests.
func (validator *Validator) ValidateTopLevelFiles() bool {
	ok := true
	if validator.Profile.AllowMiscTopLevelFiles == false {
		for filename, _ := range validator.Bag.TagFiles {
			if _, isRequiredTagFile := validator.Profile.TagFilesRequired[filename]; isRequiredTagFile {
				// This is a required tag file, and not some miscellaneous
				// item floating around the top of the bag. E.g APTrust
				// requires aptrust-info.txt, and DPN requires dpn-info.txt
				// at the top level of the bag. BagIt spec says misc items
				// outside of data dir may be considered tag files, do not
				// have to be parsed (or even parsable) and do not necessarily
				// have to be included in the tag manifests.
				continue
			}
			if !strings.Contains(filename, string(os.PathSeparator)) {
				validator.addError("Non-manifest file '%s' is not allowed "+
					"in top-level directory when BagIt profile says "+
					"AllowMiscTopLevelFiles is false.", filename)
				ok = false
			}
		}
	}
	return ok
}

// ValidateMiscDirs checks for illegal top-level directories and returns
// false if any are found.
func (validator *Validator) ValidateMiscDirs() bool {
	ok := true
	requiredTagDirs := validator.Profile.RequiredTagDirs()
	if validator.Profile.AllowMiscDirectories == false {
		for filename, _ := range validator.Bag.TagFiles {
			parts := strings.Split(filename, "/")
			if len(parts) == 1 {
				continue // OK: filename has no directory component
			}
			dir := parts[0]
			if util.StringListContains(requiredTagDirs, dir) {
				continue // OK: dir contains some required tag files
			}
			validator.addError("Directory '%s' is not allowed "+
				"in top-level directory when BagIt profile says "+
				"AllowMiscDirectories is false.", filename)
			ok = false
		}
	}
	return ok
}

// ValidateBagItVersion checks the BagIt version in bagit.txt against
// the allowed versions in validator.Profile.AcceptBagItVersion. If no
// versions are specified in the profile, we allow any version. If a
// version is specified, and there's a mismatch, this will trigger a
// validation error.
func (validator *Validator) ValidateBagItVersion() bool {
	ok := true
	allowedVersions := validator.Profile.AcceptBagItVersion
	if allowedVersions != nil && len(allowedVersions) > 0 {
		bagItVersion := ""
		bagItFile := validator.Bag.TagFiles["bagit.txt"]
		if bagItFile != nil && len(bagItFile.Tags["BagIt-Version"]) > 0 {
			bagItVersion = bagItFile.Tags["BagIt-Version"][0]
		}
		if bagItVersion == "" {
			validator.addError("Profile requires a specific BagIt version, but no " +
				"version is specified in bagit.txt")
			ok = false
		} else if !util.StringListContains(allowedVersions, bagItVersion) {
			validator.addError("BagIt version %s in bagit.txt does not match allowed "+
				"version(s) %s", bagItVersion, strings.Join(allowedVersions, ","))
			ok = false
		}
	}
	return ok
}

func (validator *Validator) ValidateAllowFetch() bool {
	ok := true
	if !validator.Profile.AllowFetchTxt && validator.Bag.TagFiles["fetch.txt"] != nil {
		validator.addError("Found fetch.txt, which BagIt profile says is not allowed.")
		ok = false
	}
	return ok
}

func (validator *Validator) ValidateManifests() bool {
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

func (validator *Validator) Errors() []string {
	return validator.errors
}

// getIterator returns either a tar file iterator or a filesystem
// iterator, depending on whether we're reading a tarred bag or
// an untarred one.
func (validator *Validator) getIterator() (fileutil.ReadIterator, error) {
	if !fileutil.FileExists(validator.Bag.Path) {
		return nil, errtypes.NewRuntimeError("Bag does not exist at %s", validator.Bag.Path)
	}
	if fileutil.IsDir(validator.Bag.Path) {
		return fileutil.NewFileSystemIterator(validator.Bag.Path)
	}
	ext := filepath.Ext(validator.Bag.Path)
	if ext == ".tar" {
		return fileutil.NewTarFileIterator(validator.Bag.Path)
	}
	// FUTURE: Support zip format
	return nil, errtypes.NewRuntimeError("Cannot read bag format. Supported formats: directory, tar.")
}

// addError adds a message to the list of validation errors.
func (validator *Validator) addError(format string, a ...interface{}) {
	validator.errors = append(validator.errors, fmt.Sprintf(format, a...))
}
