package bagit

import (
	"fmt"
	"github.com/APTrust/easy-store/constants"
	"github.com/APTrust/easy-store/errtypes"
	"github.com/APTrust/easy-store/util"
	"github.com/APTrust/easy-store/util/fileutil"
	"io"
	//"os"
	"path/filepath"
	"strings"
)

type Validator struct {
	// Bag is the bag being validated.
	Bag *Bag
	// Profile is the BagIt profile that describes a valid bag.
	Profile *BagItProfile
	// errors is a list of validation and/or runtime errors
	// that occured during validation.
	errors []string
	// payloadSize is the size, in bytes, of the files in the
	// data directory.
	payloadSize int64
	// payloadOxum is the Payload-Oxum for the bag-info.txt
	// file, as described at
	// https://tools.ietf.org/html/draft-kunze-bagit-14#section-2.2.2
	payloadOxum string
	// bagHasBeenRead indicates whether the validator has already
	// read the contents of the bag.
	bagHasBeenRead bool
	// manifestsFound is a list of algorithms for payload manifests
	// that appear in the bag. For example, if the bag contains a
	// manifest-md5.txt file and a manifest-sha256.txt file, then
	// manifestsFound will be ["md5", "sha256'] in no guaranteed
	// order.
	manifestsFound []string
	// tagManifests found lists the algorithms for all tag manifests
	// found in the bag. See manifestsFound, above.
	tagManifestsFound []string
	// topLevelDirNames is a list of directory names found in the
	// top level of the bag.
	topLevelDirNames []string
}

func NewValidator(bag *Bag, profile *BagItProfile) *Validator {
	errs := make([]string, 0)
	return &Validator{
		Bag:               bag,
		Profile:           profile,
		errors:            errs,
		bagHasBeenRead:    false,
		manifestsFound:    make([]string, 0),
		tagManifestsFound: make([]string, 0),
	}
}

func (validator *Validator) Validate() bool {
	if !validator.ValidateProfile() {
		return false
	}
	if validator.ValidateSerialization() {
		validator.ReadBag()
		// In cases where the tarred bag untars to the wrong directory,
		// we'll get lots of errors for missing files. The real error
		// is that the user needs to tar the bag with the correct top-level
		// folder name. So get rid of the other errors, and keep that one.
		if !validator.ValidateUntarDirName() {
			validator.errors = make([]string, 0)
			validator.addError("Bag should untar to a single directory " +
				"whose name matches the name of the tar file")
			return false
		}
		validator.ValidateTopLevelFiles()
		validator.ValidateMiscDirectories()
		validator.ValidateBagItVersion()
		validator.ValidateAllowFetch()
		validator.ValidateRequiredManifests()
		validator.ValidateTagFiles()
		validator.ValidateChecksums()
	}
	return len(validator.errors) == 0
}

func (validator *Validator) ReadBag() {
	validator.errors = make([]string, 0)
	err := validator.findManifests()
	if err != nil {
		validator.addError("Error getting file iterator: %v", err)
		return
	}
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
	validator.bagHasBeenRead = true
	validator.topLevelDirNames = iterator.GetTopLevelDirNames()
}

// findManifests makes a list of manifests and tag manifests that are present
// in the bag. Some bags may include more manifests than the profile requires.
// When this happens, we want to calculate checksums that we can compare to
// those manifests. For example, when a BagIt profile specifies that a bag must
// contain a manifest-md5.txt file, we have to validate that. But the bag may
// also legally contain other manifests not mentioned in the profile,
// such as manifest-sha256.txt, manifest-sha512.txt, etc. If those manifests
// are present we must validate them. This function scans the bag and makes
// a list of the manifest algorithms and tagmanifest algorithms.
func (validator *Validator) findManifests() error {
	err := validator.findManifestsByType(constants.PAYLOAD_MANIFEST)
	if err != nil {
		return err
	}
	return validator.findManifestsByType(constants.TAG_MANIFEST)
}

// findManifestsByType finds which manifests or tagmanifests are
// present in the bag.
func (validator *Validator) findManifestsByType(manifestType string) error {
	pattern := constants.ReManifest
	if manifestType == constants.TAG_MANIFEST {
		pattern = constants.ReTagManifest
	}
	iterator, err := validator.getIterator()
	if err != nil {
		return fmt.Errorf("Error getting file iterator: %v", err)
	}
	manifests, err := iterator.FindMatchingFiles(pattern)
	if err != nil {
		return fmt.Errorf("Error checking for manifests: %v", err)
	}

	// Note that we're making a list of the algorithms, not the
	// manifest file names. So manifest-md5.txt gets listed as "md5".
	// When we call CalculateChecksums() below, we can pass in these
	// lists, so the function knows which checksums to calculate.
	algs := make([]string, len(manifests))
	for i, fileName := range manifests {
		_, alg := fileutil.ParseManifestName(fileName)
		algs[i] = alg
	}
	if manifestType == constants.PAYLOAD_MANIFEST {
		validator.manifestsFound = algs
	} else {
		validator.tagManifestsFound = algs
	}
	return nil
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

	// Calculate checksums for the file
	if fileType == constants.PAYLOAD_FILE {
		algorithms := validator.manifestsFound
		if len(algorithms) == 0 && len(validator.Profile.ManifestsRequired) > 0 {
			algorithms = validator.Profile.ManifestsRequired
		}
		file.Checksums, err = fileutil.CalculateChecksums(reader, algorithms)
		if err != nil {
			return err
		}
	} else { // Tag file
		algorithms := validator.tagManifestsFound
		if len(algorithms) == 0 && len(validator.Profile.TagManifestsRequired) > 0 {
			algorithms = validator.Profile.TagManifestsRequired
		}
		// Validate only if tag manifests should or do exist.
		if len(algorithms) > 0 {
			file.Checksums, err = fileutil.CalculateChecksums(reader, algorithms)
		}
		if err != nil {
			return err
		}
	}

	// Parse the file if it's a manifest or required tag file.
	// We have to rewind the file reader to do that, or get a new
	// reader if we're reading directly out of a tar file.
	var errs []error
	isRequiredTagFile := (fileType == constants.TAG_FILE &&
		validator.Profile.RequiresTagFile(fileSummary.RelPath))
	isManifest := fileType == constants.MANIFEST
	if isManifest || isRequiredTagFile {
		rewoundReader, isNewReader, err := validator.rewindReader(reader, fileSummary.RelPath)
		if err != nil {
			return err
		}
		// This is a runtime error that should never occur.
		// Check that directory names inside the bag are correct,
		// and that the untarred dir of a tarred bag matches the
		// tar file name.
		if rewoundReader == nil {
			return fmt.Errorf("Could not rewind reader for %s", fileSummary.RelPath)
		}
		if isNewReader && rewoundReader != nil {
			defer rewoundReader.Close()
		}
		if isManifest {
			errs = file.ParseAsManifest(rewoundReader, fileSummary.RelPath)
		} else if isRequiredTagFile {
			errs = file.ParseAsTagFile(rewoundReader, fileSummary.RelPath)
		}
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

// rewindReader returns a reader that points to the beginning of
// whatever reader points to.
// CalclateChecksums advanced the file pointer to the end of the file.
// For normal files, we can just rewind, but if we're reading an
// embedded tar file, we're working with a forward-only reader, so
// we need to get a new reader that points to the start of the file.
func (validator *Validator) rewindReader(reader io.ReadCloser, filePath string) (io.ReadCloser, bool, error) {
	var err error
	isNewReader := false
	if readSeeker, isSeeker := reader.(io.ReadSeeker); isSeeker {
		_, err = readSeeker.Seek(0, io.SeekStart)
	} else {
		// Assuming we're working with a tar file and a TarFileIterator.
		reader.Close()
		iter, err := validator.getIterator()
		if err == nil {
			bagName := filepath.Base(validator.Bag.Path)
			pathInTarFile := fmt.Sprintf("%s/%s", bagName[:len(bagName)-4], filePath)
			reader, err = iter.OpenFile(pathInTarFile)
			isNewReader = true
		}
	}
	return reader, isNewReader, err
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
	if serialization == constants.REQUIRED && isDir {
		validator.addError("Serialization is required, but bag is a directory")
		ok = false
	}
	if isFile {
		if serialization == constants.FORBIDDEN {
			validator.addError("Serialization is forbidden, but bag is a single file")
			ok = false
		} else {
			ok = validator.ValidateSerializationFormat()
		}
	}
	return ok
}

// ValidateSerializationFormat returns false if the bag we're
// validating is serialized (e.g. in tar, zip, or some other non-directory
// format) and the format is not in the list of accepted formats
// specified in validator.Profile.AcceptSerialization. This also
// returns false if the bag is serialized in any format
// validator.Profile.AcceptSerialization is not defined or
// validator.Profile.Serialization is set to "forbidden".
func (validator *Validator) ValidateSerializationFormat() bool {
	if validator.Profile.AcceptSerialization == nil {
		validator.addError("Bag is serialized, but profile does not specify accepted serializations.")
		return false
	}
	extension := filepath.Ext(validator.Bag.Path)
	mimeTypes, typeIsKnown := constants.SerializationFormats[extension]
	if !typeIsKnown {
		validator.addError("Unknown serialization type for format %s.", extension)
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
			"Accept-Serialization list for this BagIt profile.", extension)
	}
	return ok
}

// ValidateTopLevelFiles returns false if the BagIt profile says
// AllowMiscTopLevelFiles is false and the bag contains files in the
// top-level directory that are neither manifests nor tag manifests.
func (validator *Validator) ValidateTopLevelFiles() bool {
	if !validator.bagHasBeenRead {
		validator.ReadBag()
	}
	ok := true
	if validator.Profile.AllowMiscTopLevelFiles == false {
		for filename, _ := range validator.Bag.TagFiles {
			if validator.Profile.RequiresTagFile(filename) {
				// This is a required tag file, and not some miscellaneous
				// item floating around the top of the bag. E.g APTrust
				// requires aptrust-info.txt, and DPN requires dpn-info.txt
				// at the top level of the bag. BagIt spec says misc items
				// outside of data dir may be considered tag files, do not
				// have to be parsed (or even parsable) and do not necessarily
				// have to be included in the tag manifests.
				continue
			}
			// Changed os.PathSeparator to "/" because BagIt uses forward slash
			if !strings.Contains(filename, "/") {
				validator.addError("Non-manifest file '%s' is not allowed "+
					"in top-level directory when BagIt profile says "+
					"AllowMiscTopLevelFiles is false.", filename)
				ok = false
			}
		}
	}
	return ok
}

// ValidateMiscDirectories checks for illegal top-level directories and returns
// false if any are found.
func (validator *Validator) ValidateMiscDirectories() bool {
	if !validator.bagHasBeenRead {
		validator.ReadBag()
	}
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
				"AllowMiscDirectories is false.", dir)
			ok = false
		}
	}
	return ok
}

// ValidateUntarDirName checks to see that, if this is a tarred bag, it
// untars to a directory whose name matches the tar file name, as suggested
// by the BagIt spec, section 4, serialization.
// https://tools.ietf.org/html/draft-kunze-bagit-14
func (validator *Validator) ValidateUntarDirName() bool {
	ok := true
	if strings.HasSuffix(validator.Bag.Path, ".tar") {
		bagName := filepath.Base(validator.Bag.Path)
		bagName = bagName[0 : len(bagName)-4]
		for _, dirName := range validator.topLevelDirNames {
			if !strings.HasPrefix(dirName, bagName) {
				ok = false
			}
		}
		if validator.topLevelDirNames[0] != bagName {
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
	if !validator.bagHasBeenRead {
		validator.ReadBag()
	}
	ok := true
	allowedVersions := validator.Profile.AcceptBagItVersion
	if allowedVersions != nil && len(allowedVersions) > 0 {
		bagItVersion := ""
		bagItFile := validator.Bag.TagFiles["bagit.txt"]
		if bagItFile == nil {
			validator.addError("Cannot check bagit version because bagit.txt is missing.")
			return false
		}
		bagItVersionTags := bagItFile.ParsedData.FindByKey("BagIt-Version")
		if bagItFile != nil && len(bagItVersionTags) > 0 {
			bagItVersion = bagItVersionTags[0].Value
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

// ValidateAllowFetch returns false and sets an error message if
// validator.Profile.AllowFetchTxt is false and the bag contains
// a fetch.txt file.
func (validator *Validator) ValidateAllowFetch() bool {
	if !validator.bagHasBeenRead {
		validator.ReadBag()
	}
	ok := true
	if !validator.Profile.AllowFetchTxt && validator.Bag.TagFiles["fetch.txt"] != nil {
		validator.addError("Found fetch.txt, which BagIt profile says is not allowed.")
		ok = false
	}
	return ok
}

// ValidateRequiredManifests checks to see whether the manifests
// and tag manifests specified in validator.Profile.ManifestsRequired
// and validator.Profile.TagManifestsRequired are actually present.
func (validator *Validator) ValidateRequiredManifests() bool {
	ok := true
	if !validator.bagHasBeenRead {
		validator.ReadBag()
	}
	for _, algorithm := range validator.Profile.ManifestsRequired {
		filePath := fmt.Sprintf("manifest-%s.txt", algorithm)
		if validator.Bag.Manifests[filePath] == nil {
			validator.addError("Required manifest '%s' is missing.", filePath)
			ok = false
		}
	}
	for _, algorithm := range validator.Profile.TagManifestsRequired {
		filePath := fmt.Sprintf("tagmanifest-%s.txt", algorithm)
		if validator.Bag.TagManifests[filePath] == nil {
			validator.addError("Required tag manifest '%s' is missing.", filePath)
			ok = false
		}
	}
	return ok
}

// ValidateTag files checks that required tag files, as specified
// in the BagItProfile, are present and defined tags are present with
// allowed values. This does not try to parse or verify the presence
// of any tag files not mentioned in validator.Profile.TagFilesRequired.
func (validator *Validator) ValidateTagFiles() bool {
	ok := true
	if !validator.bagHasBeenRead {
		validator.ReadBag()
	}
	for _, tag := range validator.Profile.RequiredTags {
		tagFile := validator.Bag.TagFiles[tag.TagFile]
		if tagFile == nil {
			validator.addError("Required tag file '%s' is missing.", tag.TagFile)
			ok = false
		} else {
			// Check the tags
			tagValues := tagFile.ParsedData.ValuesForKey(tag.TagName)
			tagIsValid := validator.ValidateTag(tag, tagValues)
			if !tagIsValid {
				ok = false
			}
		}
	}
	return ok
}

// Validate tag validates a single tag to ensure it meets the requirements
// in validator.Profile's tag definitions. Param filePath is the relative
// path within the bag of the file in which the tag was found. Param
// tagDef is a definition of the requirements for the tag. Param tagValues
// is the list of values for this tag, as parsed from the tagfile.
func (validator *Validator) ValidateTag(tag *TagDefinition, tagValues []string) bool {
	tagIsMissing := (tagValues == nil || len(tagValues) == 0)
	tagIsEmpty := true
	if !tagIsMissing {
		for _, val := range tagValues {
			if val != "" {
				tagIsEmpty = false
			}
		}
	}
	if !tag.Required && tagIsMissing {
		return true
	}
	if tag.EmptyOk && tagIsEmpty {
		return true
	}
	if tag.Required && tagIsMissing {
		validator.addError("Required tag '%s' is missing from file '%s'.", tag.TagName, tag.TagFile)
		return false
	}
	if !tag.EmptyOk && tagIsEmpty {
		validator.addError("Tag '%s' in file '%s' cannot be empty.", tag.TagName, tag.TagFile)
		return false
	}
	// We have a tag and a value. Make sure the value is allowed.
	ok := true
	for _, tagValue := range tagValues {
		err := tag.ValueIsAllowed(tagValue)
		if err != nil {
			validator.addError("In file '%s': %s", tag.TagFile, err.Error())
			ok = false
		}
	}
	return ok
}

// ValidateChecksums makes sure that checksums in manifests are
// correct and complete, and that no payload files exist that
// are not mentioned in the manifests. Note that the BagIt spec
// says non-payload files may be excluded from the tag manifests.
// See the section 2.2.4 of the specification at
// https://tools.ietf.org/html/draft-kunze-bagit-14#section-2.2.4
func (validator *Validator) ValidateChecksums() bool {
	ok := true
	if !validator.bagHasBeenRead {
		validator.ReadBag()
	}
	// Check payload files against manifests
	for filename, payloadFile := range validator.Bag.Payload {
		for manifestName, _ := range validator.Bag.Manifests {
			_, algorithm := fileutil.ParseManifestName(manifestName)
			checksum, _ := validator.Bag.GetChecksumFromManifest(algorithm, filename)
			if checksum == "" {
				validator.addError("No checksum found for %s in %s", filename, manifestName)
				ok = false
			} else if checksum != payloadFile.Checksums[algorithm] {
				validator.addError("Digest for %s in manifest %s: '%s' "+
					"does not match actual '%s'", filename, manifestName, checksum,
					payloadFile.Checksums[algorithm])
				ok = false
			}
		}
	}
	// Make sure no payload files are missing.
	for manifestName, manifest := range validator.Bag.Manifests {
		for _, item := range manifest.ParsedData.Items() {
			filename := item.Key
			if validator.Bag.Payload[filename] == nil {
				validator.addError("File %s in manifest %s is missing from the data directory",
					filename, manifestName)
				ok = false
			}
		}
	}
	// Check tag files against tag manifests.
	for filename, tagFile := range validator.Bag.TagFiles {
		for manifestName, _ := range validator.Bag.TagManifests {
			algorithm := strings.Split(strings.Split(manifestName, ".")[0], "-")[1]
			checksum, _ := validator.Bag.GetChecksumFromTagManifest(algorithm, filename)
			if checksum == "" {
				// OK. BagIt spec says tag files don't have to be in tag manifest.
				// Implied in https://tools.ietf.org/html/draft-kunze-bagit-14#section-2.2.4
			} else if checksum != tagFile.Checksums[algorithm] {
				validator.addError("Digest for %s in tag manifest %s: '%s' "+
					"does not match actual '%s'", filename, manifestName, checksum,
					tagFile.Checksums[algorithm])
				ok = false
			}
		}
	}
	return ok
}

// ValidateProfile ensures that the BagItProfile is valid.
// We check this before attempting validation.
func (validator *Validator) ValidateProfile() bool {
	ok := true
	errs := validator.Profile.Validate()
	for _, err := range errs {
		validator.addError(err.Error())
		ok = false
	}
	return ok
}

// Errors returns a list of validation errors.
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
// It will not add duplicate messages.
func (validator *Validator) addError(format string, a ...interface{}) {
	msg := fmt.Sprintf(format, a...)
	if !util.StringListContains(validator.Errors(), msg) {
		validator.errors = append(validator.errors, msg)
	}
}
