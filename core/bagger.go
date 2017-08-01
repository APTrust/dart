package core

import (
	"fmt"
	// "github.com/APTrust/bagit/util"
	"github.com/APTrust/bagit/util/fileutil"
	"os"
	"path/filepath"
	// "strings"
)

type Bagger struct {
	bag     *Bag
	profile *BagItProfile
	errors  []string
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
		bag:     NewBag(bagPath),
		profile: profile,
		errors:  make([]string, 0),
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
	manifestType, alg := fileutil.ParseManifestName(relDestPath)
	if manifestType != "" && alg != "" {
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
		fileSummary := &fileutil.FileSummary{
			RelPath:       relDestPath,
			IsDir:         false,
			IsRegularFile: true,
		}
		bagger.bag.TagFiles[relDestPath] = NewFile(fileSummary)
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

/*

- Validate Profile
- Validate that all required tags are present
- Include progress callback or io.Writer for writing progress messages
- Add all payload files to bag in working dir
- Build tag files
- Create manifests

- Tar bag if serialization is required and serlialization format is tar?
- Provide a way of specifying tag files and where to put them?
- Parse existing tag files, and skip defaults if they're already defined in existing tag files?

*/

// WriteBag writes the bag to disk, returning true on success,
// and false if there were errors. Check bagger.Errors() if this
// returns false.
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
	bagger.copyExistingFiles()
	bagger.writeTags()
	bagger.writeManifests()
	return true
}

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

// addPayloadFile adds one file from the source directory into the
// bag's payload (data) directory.
func (bagger *Bagger) copyFile(file *File) bool {
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

func (bagger *Bagger) writeTags() bool {
	// for filename, tagmap := range bagger.profile.TagFilesRequired {
	// 	if !bagger.writeTagFile(filename, tagmap) {
	// 		return false
	// 	}
	// }
	return true
}

func (bagger *Bagger) writeTagFile(filename string, tagmap map[string]*KeyValuePair) bool {
	return true
}

func (bagger *Bagger) writeManifests() bool {
	return true
}

func (bagger *Bagger) writeManifest(f *File) bool {
	return true
}

func (bagger *Bagger) hasRequiredTags() bool {
	ok := true
	for relFilePath, mapOfRequiredTags := range bagger.profile.TagFilesRequired {
		for tagname, tagdesc := range mapOfRequiredTags {
			values, tagIsPresent, hasNonEmptyValue, err := bagger.bag.GetTagValuesFromFile(relFilePath, tagname)
			if tagdesc.Required && !tagIsPresent {
				bagger.addError("Required tag %s for file %s is missing", tagname, relFilePath)
				ok = false
			}
			if !tagdesc.EmptyOk && tagIsPresent && !hasNonEmptyValue {
				bagger.addError("Tag %s for file %s cannot be empty", tagname, relFilePath)
				ok = false
			}
			if hasNonEmptyValue && tagIsPresent {
				for _, value := range values {
					if err = tagdesc.ValueIsAllowed(value); err != nil {
						bagger.addError(err.Error())
						ok = false
					}
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
			if fileutil.LooksSafeToDelete(bagger.bag.Path, 12, 3) {
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
	err := os.MkdirAll(bagger.bag.Path, 0755)
	if err != nil {
		bagger.addError(err.Error())
		return false
	}
	return true
}

// addError adds a message to the list of bagging errors.
func (bagger *Bagger) addError(format string, a ...interface{}) {
	bagger.errors = append(bagger.errors, fmt.Sprintf(format, a...))
}
