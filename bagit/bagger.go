package bagit

import (
	"fmt"
	"github.com/APTrust/easy-store/util/fileutil"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
)

type Bagger struct {
	bag      *Bag
	profile  *BagItProfile
	skipCopy map[string]bool
	errors   []string
}

// NewBagger creates a new Bagger.
//
// Param bagPath is the path to the location where the bag should
// be built. This should be a directory name. The bagger will
// create the directory, if it does not already exist.
//
// Param profile is the BagIt profile that describes the requirements
// for the bag.
func NewBagger(bagPath string, profile *BagItProfile) (*Bagger, error) {
	if profile == nil {
		return nil, fmt.Errorf("Param profile cannot be nil")
	}
	if bagPath == "" {
		return nil, fmt.Errorf("Param bagPath cannot be empty")
	}
	bagger := &Bagger{
		bag:      NewBag(bagPath),
		profile:  profile,
		errors:   make([]string, 0),
		skipCopy: make(map[string]bool),
	}
	return bagger, nil
}

// AddFile adds a file to the bag. Param absSourcePath is the path
// of the file to add. Param relDestPath is the relative path within
// the bag where the file should be added. For example, the following
// adds a payload file to the data directory:
//
// bagger.AddFile("/home/joe/document.pdf", "data/document.pdf")
//
// This adds a tag file to the top-level directory:
//
// bagger.AddFile("/home/joe/custom-tag-data.txt", "custom-tag-data.txt")
//
// This adds a tag file to a custom tag directory:
//
// bagger.AddFile("/home/joe/tag-info.txt", "custom-tags/tag-info.txt")
//
// Don't add manifests here, or you'll get an error.
func (bagger *Bagger) AddFile(absSourcePath, relDestPath string) bool {
	if fileutil.LooksLikeManifest(relDestPath) {
		bagger.addError("Don't add manifest '%s' through AddFile", relDestPath)
		return false
	}
	fs, err := fileutil.NewFileSummaryFromPath(absSourcePath)
	if err != nil {
		bagger.addError("Error adding %s: %v", absSourcePath, err)
		return false
	}
	fs.RelPath = relDestPath
	_, _ = bagger.bag.AddFileFromSummary(fs)
	return true
}

// AddTag adds a tag that will be written to a text manifest when
// the bag is written to disk. Param relDestPath is the relative
// path within the file where this tag should be written. Param tag
// is the tag to write. If a tag has multiple Values, they will be
// written in the order they appear. The following example adds the
// Title tag to the aptrust-info.txt file:
//
// titleTag := NewTag("Title", "An Inquiry into Human Understanding")
// bagger.AddTag("aptrust-info.txt", titleTag)
//
// When you call bagger.BuildBag(), the bagger will create the tag
// file and write in the tags, only for the tags you've added.
// Tags will be written in the order they were added, since the
// BagIt spec says tag order should be preserved.
//
// You can skip this behavior and copy in your own tag files using
// bagger.AddFile(). If you're adding tags for a file like bag-info.txt,
// don't also copy in bag-info.txt through bagger.AddFile(), since
// that will cause bag-info.txt to be written twice.
func (bagger *Bagger) AddTag(relDestPath string, tag *KeyValuePair) bool {
	if bagger.bag.TagFiles[relDestPath] != nil {
		if bagger.bag.TagFiles[relDestPath].FileSummary.Size > 0 {
			bagger.addError("Tag file '%s' was added via AddFile(). "+
				"You cannot add new values to it using AddTag(). "+
				"Value was for tag '%s'.", relDestPath, tag.Key)
			return false
		}
	} else {
		// Add the tag file to the bag
		fileSummary := &fileutil.FileSummary{
			RelPath:       relDestPath,
			IsDir:         false,
			IsRegularFile: true,
		}
		bagger.bag.TagFiles[relDestPath] = NewFile(fileSummary)
		bagger.skipCopy[relDestPath] = true
	}
	bagger.bag.TagFiles[relDestPath].ParsedData.Append(tag.Key, tag.Value)
	return true
}

// Profile returns the BagItProfile used to construct this bag.
func (bagger *Bagger) Profile() BagItProfile {
	return *bagger.profile
}

// Bag returns a bag object that describes the bag being built.
func (bagger *Bagger) Bag() Bag {
	return *bagger.bag
}

// Errors returns a list of errors that occurred duing the bagging
// process.
func (bagger *Bagger) Errors() []string {
	return bagger.errors
}

// WriteBag writes the bag to a directory on disk. (See WriteBagToTarFile
// if you want to write directly to a tar file instead of to a directory.
// This returns true on success, and false if there were errors. Check
// bagger.Errors() if this returns false.
//
// Set overwrite to true if you want the bagger to overwrite
// an existing version of the bag.
//
// Set param checkRequiredTags to true if you are
// passing in tags through bagger.AddTag() and you want to make
// sure all required tags are present and valid. Set it to false
// if you are copying in tag files like bag-info.txt through
// bagger.AddFile().
func (bagger *Bagger) WriteBag(overwrite, checkRequiredTags bool) bool {
	if !bagger.prepareForWrite(overwrite, checkRequiredTags) {
		return false
	}
	bagger.ensureManifests()
	bagger.copyExistingFiles()
	bagger.addOxumToBagInfo()
	bagger.writeTags()
	bagger.writeManifests()
	return true
}

// WriteBagToTarFile writes the bag directly to a tar file instead
// of writing it to a directory. (See WriteBag if you want to write
// an untarred bag.) This returns true on success, and false if there
// were errors. Check bagger.Errors() if this returns false.
//
// Set overwrite to true if you want the bagger to overwrite
// an existing version of the bag.
//
// Set param checkRequiredTags to true if you are
// passing in tags through bagger.AddTag() and you want to make
// sure all required tags are present and valid. Set it to false
// if you are copying in tag files like bag-info.txt through
// bagger.AddFile().
func (bagger *Bagger) WriteBagToTarFile(overwrite, checkRequiredTags bool) bool {
	if !strings.HasSuffix(bagger.bag.Path, ".tar") {
		bagger.addError(fmt.Sprintf("Bag path '%s' should end in .tar "+
			"when calling WriteBagToTarFile", bagger.bag.Path))
		return false
	}
	if !bagger.prepareForWrite(overwrite, checkRequiredTags) {
		return false
	}
	bagger.ensureManifests()

	writer := fileutil.NewTarWriter(bagger.bag.Path)
	defer writer.Close()
	err := writer.Open()
	if err != nil {
		bagger.addError(fmt.Sprintf("Error opening tar writer for '%s': %v", bagger.bag.Path, err))
		return false
	}

	bagger.tarExistingFiles(writer)
	bagger.addOxumToBagInfo()
	bagger.tarTagFiles(writer)
	bagger.tarManifests(writer)
	return true
}

func (bagger *Bagger) prepareForWrite(overwrite, checkRequiredTags bool) bool {
	bagger.errors = make([]string, 0)
	errs := bagger.profile.Validate()
	if errs != nil && len(errs) > 0 {
		for _, err := range errs {
			bagger.addError(err.Error())
		}
		return false
	}
	ok := bagger.initFileOrDir(overwrite)
	if !ok {
		return false
	}
	if checkRequiredTags {
		ok = bagger.hasRequiredTags()
		if !ok {
			return false
		}
	}
	return true
}

// copyExistingFiles copies any files that already exist on disk
// into the bag directory. Existing files should include all payload
// files, and may include some tag files.
func (bagger *Bagger) copyExistingFiles() bool {
	for _, file := range bagger.bag.Payload {
		if !bagger.copyFile(file) {
			return false
		}
	}
	for _, file := range bagger.bag.TagFiles {
		if !bagger.copyFile(file) {
			return false
		}
	}
	return true
}

// copyFile copies one file from its source location into the
// bag directory. The file being copied may be part of the payload
// or it could be a tag file.
//
// ---------------------------------------------------------------------
// TODO: *** PRESERVE TIMESTAMPS ON COPY ***
// ---------------------------------------------------------------------
func (bagger *Bagger) copyFile(file *File) bool {
	if bagger.skipCopy[file.FileSummary.RelPath] {
		// This is a tag file we'll write ourselves,
		// based on tags added through AddTag()
		return true
	}
	srcPath := file.FileSummary.AbsPath
	destPath := filepath.Join(bagger.bag.Path, file.FileSummary.RelPath)
	if fileutil.FileExists(destPath) {
		bagger.addError(fmt.Sprintf("Cannot copy to %s: file already exists", destPath))
		return false
	}

	// Make sure the destination directory exists
	destDir := filepath.Dir(destPath)
	if !fileutil.IsDir(destDir) {
		err := os.MkdirAll(destDir, 0755)
		if err != nil {
			bagger.addError(err.Error())
			return false
		}
	}

	// srcFile is the reader we'll copy from
	srcFile, err := os.Open(srcPath)
	defer srcFile.Close()
	if err != nil {
		bagger.addError(err.Error())
		return false
	}

	// destFile is the writer we'll copy to
	destFile, err := os.OpenFile(destPath, os.O_RDWR|os.O_CREATE, file.FileSummary.Mode)
	defer destFile.Close()
	if err != nil {
		bagger.addError(err.Error())
		return false
	}

	// Copy src to dest, and keep track of the checksums
	// Note that param bagger.profile.ManifestsRequired is a list
	// of algorithms for required checksum manifests. E.g.
	// "md5", "sha256", etc.
	checksums, err := fileutil.WriteWithChecksums(srcFile, destFile, bagger.profile.ManifestsRequired)
	if err != nil {
		bagger.addError(err.Error())
		return false
	}

	// Attach the file's checksums, which we'll need
	// soon when we write the manifests.
	file.Checksums = checksums
	return true
}

// tarExistingFiles copies any files that already exist on disk
// into the tar archive. Existing files should include all payload
// files, and may include some tag files.
func (bagger *Bagger) tarExistingFiles(tarWriter *fileutil.TarWriter) bool {
	for _, file := range bagger.bag.Payload {
		if !bagger.addTarFile(tarWriter, file) {
			return false
		}
	}
	for _, file := range bagger.bag.TagFiles {
		if !bagger.addTarFile(tarWriter, file) {
			return false
		}
	}
	return true
}

// addTarFile adds one file from its source location into the
// tar archive. The file being added may be part of the payload
// or it could be a tag file.
func (bagger *Bagger) addTarFile(tarWriter *fileutil.TarWriter, file *File) bool {
	if bagger.skipCopy[file.FileSummary.RelPath] {
		// This is a tag file we'll write ourselves,
		// based on tags added through AddTag()
		return true
	}
	if file.Checksums != nil && len(file.Checksums) > 0 {
		// This file has already been added to the tar archive.
		return true
	}

	// srcPath is the full path to the file we're going to copy into
	// the tar archive.
	srcPath := file.FileSummary.AbsPath

	// destPath is the path the file will have inside the archive.
	// Note that the bagit spec says the tar file must untar to a
	// directory whose name matches the tar file, minus the .tar
	// extension. E.g. my_bag.tar must untar to a directory called
	// my_bag. For that to happen, we have to add the bag name prefix
	// onto the relative path of every file.
	prefix := fileutil.BaseNameWithoutExtension(tarWriter.PathToTarFile)
	destPath := filepath.Join(prefix, file.FileSummary.RelPath)

	// Copy src to dest, and keep track of the checksums.
	// Note that param bagger.profile.ManifestsRequired is a list
	// of algorithms for required checksum manifests. E.g.
	// "md5", "sha256", etc.
	checksums, err := tarWriter.AddToArchive(srcPath, destPath, bagger.profile.ManifestsRequired)
	if err != nil {
		bagger.addError(err.Error())
		return false
	}

	// Attach the file's checksums, which we'll need
	// soon when we write the manifests.
	file.Checksums = checksums
	return true
}

// writeTags writes the tag files into the bag
func (bagger *Bagger) writeTags() bool {
	for _, file := range bagger.bag.TagFiles {
		destPath := filepath.Join(bagger.bag.Path, file.FileSummary.RelPath)
		err := file.Write(destPath, bagger.profile.TagManifestsRequired)
		if err != nil {
			bagger.addError("Error writing tag file '%s'", destPath, err.Error())
			return false
		}
	}
	return true
}

// tarTagFiles writes the tag files into the archive.
func (bagger *Bagger) tarTagFiles(tarWriter *fileutil.TarWriter) bool {
	for _, file := range bagger.bag.TagFiles {
		if !bagger.writeTempFileIntoArchive(tarWriter, file) {
			return false
		}
	}
	return true
}

// tarManifests writes payload and tag manifests into the tar archive.
func (bagger *Bagger) tarManifests(tarWriter *fileutil.TarWriter) bool {
	// Write the manifest-*.txt files, and track the checksums of those
	// files so we can add their checksums into the tag manifest files.
	bagger.bag.AddChecksumsToManifests()
	for _, file := range bagger.bag.Manifests {
		if !bagger.writeTempFileIntoArchive(tarWriter, file) {
			return false
		}
	}
	// Write the tagmanifest-*.txt files. Don't bother calculating
	// checksums on these.
	bagger.bag.AddChecksumsToTagManifests()
	for _, file := range bagger.bag.TagManifests {
		if !bagger.writeTempFileIntoArchive(tarWriter, file) {
			return false
		}
	}
	return true
}

// writeTempFileIntoArchive writes a tag file or manifest to a temp file,
// copies it into the tar archive, and then deletes it. Returns true if
// it succeeds.
func (bagger *Bagger) writeTempFileIntoArchive(tarWriter *fileutil.TarWriter, file *File) bool {
	tmpDir, err := ioutil.TempDir("", "easy-store")
	if err != nil {
		bagger.addError("Could not create temp file to write tags: %s", err.Error())
		return false
	}
	defer os.RemoveAll(tmpDir) // doesn't execute until we exit for loop

	// Create a name for the temp file.
	slash := "/"
	if strings.Contains(file.FileSummary.RelPath, "\\") &&
		!strings.Contains(file.FileSummary.RelPath, "/") {
		slash = "\\"
	}
	tmpFile := filepath.Join(tmpDir, strings.Replace(file.FileSummary.RelPath, slash, "_", 0))
	err = file.Write(tmpFile, bagger.profile.TagManifestsRequired)
	if err != nil {
		bagger.addError("Error writing tag file '%s'", tmpFile, err.Error())
		return false
	}
	// Copy the temp file into the archive. We don't need to capture the
	// checksums, because they were set in the call to file.Write above.
	// See comment above in addTarFile for why we add the prefix.
	prefix := fileutil.BaseNameWithoutExtension(tarWriter.PathToTarFile)
	destPath := filepath.Join(prefix, file.FileSummary.RelPath)
	_, err = tarWriter.AddToArchive(tmpFile, destPath, []string{})
	if err != nil {
		bagger.addError(err.Error())
		return false
	}
	return true
}

// ensureManifests ensures that the bag has a representation of
// the required manifests and tag manifests. These must exist so
// we can add the checksums to them later.
func (bagger *Bagger) ensureManifests() {
	for _, algorithm := range bagger.profile.ManifestsRequired {
		name := fmt.Sprintf("manifest-%s.txt", algorithm)
		if bagger.bag.Manifests[algorithm] == nil {
			fs := &fileutil.FileSummary{
				RelPath: name,
			}
			bagger.bag.AddFileFromSummary(fs)
		}
	}
	for _, algorithm := range bagger.profile.TagManifestsRequired {
		name := fmt.Sprintf("tagmanifest-%s.txt", algorithm)
		if bagger.bag.TagManifests[algorithm] == nil {
			fs := &fileutil.FileSummary{
				RelPath: name,
			}
			bagger.bag.AddFileFromSummary(fs)
		}
	}
}

func (bagger *Bagger) writeManifests() bool {
	// Write the manifest-*.txt files, and track the checksums of those
	// files so we can add their checksums into the tag manifest files.
	bagger.bag.AddChecksumsToManifests()
	for _, file := range bagger.bag.Manifests {
		destPath := filepath.Join(bagger.bag.Path, file.FileSummary.RelPath)
		err := file.Write(destPath, bagger.profile.TagManifestsRequired)
		if err != nil {
			bagger.addError("Error writing manifest '%s'", destPath, err.Error())
			return false
		}
	}
	// Write the tagmanifest-*.txt files. Don't bother calculating
	// checksums on these.
	bagger.bag.AddChecksumsToTagManifests()
	for _, file := range bagger.bag.TagManifests {
		destPath := filepath.Join(bagger.bag.Path, file.FileSummary.RelPath)
		err := file.Write(destPath, nil)
		if err != nil {
			bagger.addError("Error writing tag manifest '%s'", destPath, err.Error())
			return false
		}
	}
	return true
}

// hasRequiredTags returns true if we have all the tags required by the
// BagIt profile.
func (bagger *Bagger) hasRequiredTags() bool {
	ok := true
	for _, tag := range bagger.profile.RequiredTags {
		values, tagIsPresent, hasNonEmptyValue, err := bagger.bag.GetTagValuesFromFile(tag.TagFile, tag.TagName)
		if tag.Required && !tagIsPresent {
			bagger.addError("Required tag %s for file %s is missing", tag.TagName, tag.TagFile)
			ok = false
		}
		if !tag.EmptyOk && tagIsPresent && !hasNonEmptyValue {
			bagger.addError("Tag %s for file %s cannot be empty", tag.TagName, tag.TagFile)
			ok = false
		}
		if hasNonEmptyValue && tagIsPresent {
			for _, value := range values {
				if err = tag.ValueIsAllowed(value); err != nil {
					bagger.addError(err.Error())
					ok = false
				}
			}
		}
	}
	return ok
}

// initFileOrDir creates the directory in which we'll assemble the bag,
// performing some safety checks along the way. Returns true on
// success, false otherwise.
func (bagger *Bagger) initFileOrDir(overwrite bool) bool {
	if fileutil.FileExists(bagger.bag.Path) {
		if overwrite {
			if fileutil.LooksSafeToDelete(bagger.bag.Path, 14, 2) {
				err := os.RemoveAll(bagger.bag.Path)
				if err != nil {
					bagger.addError("Error removing existing %s", bagger.bag.Path, err.Error())
					return false
				}
			} else {
				bagger.addError("%s already exists and does not look safe to delete. "+
					"Choose a different path for this bag.",
					bagger.bag.Path)
				return false
			}
		} else {
			bagger.addError("%s already exists. Use overwrite=true to replace it.",
				bagger.bag.Path)
			return false
		}
	}
	if !strings.HasSuffix(bagger.bag.Path, ".tar") {
		err := os.MkdirAll(bagger.bag.Path, 0755)
		if err != nil {
			bagger.addError(err.Error())
			return false
		}
	}
	return true
}

// getPayloadOxum returns ByteCount.FileCount for the payload.
// This is only accurate after you've added all files through AddFile.
// See Payload-Oxum at https://tools.ietf.org/html/draft-kunze-bagit-14
func (bagger *Bagger) GetPayloadOxum() string {
	byteCount := int64(0)
	fileCount := 0
	for _, file := range bagger.bag.Payload {
		byteCount += file.FileSummary.Size
		fileCount += 1
	}
	return fmt.Sprintf("%d.%d", byteCount, fileCount)
}

func (bagger *Bagger) addOxumToBagInfo() {
	bagInfo := bagger.bag.TagFiles["bag-info.txt"]
	oxum := bagInfo.ParsedData.FirstValueForKey("Payload-Oxum")
	if oxum == "" {
		bagInfo.ParsedData.Append("Payload-Oxum", bagger.GetPayloadOxum())
	}
}

// addError adds a message to the list of bagging errors.
func (bagger *Bagger) addError(format string, a ...interface{}) {
	bagger.errors = append(bagger.errors, fmt.Sprintf(format, a...))
}
