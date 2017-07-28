package core

import (
	"fmt"
	"github.com/APTrust/bagit/util"
	"github.com/APTrust/bagit/util/fileutil"
	"os"
	"path/filepath"
	"strings"
)

type Bagger struct {
	bag     *Bag
	profile *BagItProfile
	files   map[string]*fileutil.FileSummary

	// Use bag.TagFiles instead of this hash
	tags      map[string][]*Tag
	tarWriter *fileutil.TarWriter
	errors    []string

	// TODO: Delete these
	PayloadDir string
}

// NewBagger creates a new Bagger.
//
// Param bagPath is the path to the location where the bag should
// be built. This should be a directory name. The bagger will
// create the directory, if it does not already exist. If bagPath ends with
// ".tar", the bag will be created as a tar file instead of as a directory.
//
// Param profile is the BagIt profile that describes the requirements
// for the bag.
func NewBagger(bagPath string, profile *BagItProfile) *Bagger {
	bagger := &Bagger{
		bag:     NewBag(bagPath),
		profile: profile,
		files:   make(map[string]*fileutil.FileSummary),
		tags:    make(map[string][]*Tag),
		errors:  make([]string, 0),
	}
	if strings.HasSuffix(bagPath, ".tar") {
		bagger.tarWriter = fileutil.NewTarWriter(bagPath)
	}
	return bagger
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
	bagger.files[absSourcePath] = fs
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
func (bagger *Bagger) AddTag(relDestPath string, tag *Tag) bool {
	if bagger.tags[relDestPath] == nil {
		bagger.tags[relDestPath] = make([]*Tag, 0)
	}
	bagger.tags[relDestPath] = append(bagger.tags[relDestPath], tag)
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
	bagger.copyPayload()

	// write tag files
	// create manifests

	return true
}

func (bagger *Bagger) writeTagFiles() bool {
	for filename, tagmap := range bagger.profile.TagFilesRequired {
		if !bagger.writeTagFile(filename, tagmap) {
			return false
		}
	}
	return true
}

func (bagger *Bagger) writeTagFile(filename string, tagmap map[string]*Tag) bool {
	//var checksums map[string]string
	var err error
	if bagger.tarWriter != nil {
		// Write the tag file into the tar archive, and keep track of its checksums
		// checksums, err = bagger.tarWriter.AddToArchive(filename, tagmap, bagger.profile.ManifestsRequired)
	} else {
		targetPath := filepath.Join(bagger.bag.Path, filename)
		if fileutil.FileExists(targetPath) {
			bagger.addError(fmt.Sprintf("Cannot write tag file %s: file already exists", targetPath))
			return false
		}
		targetDir := filepath.Dir(targetPath)
		if !fileutil.IsDir(targetDir) {
			err := os.MkdirAll(targetDir, 0755)
			if err != nil {
				bagger.addError(err.Error())
				return false
			}
		}
		tagFile, err := os.Create(targetPath)
		defer tagFile.Close()
		if err != nil {
			bagger.addError(err.Error())
			return false
		}

		// Copy src to dest, and keep track of the checksums
		// checksums, err = fileutil.WriteWithChecksums(srcFile, destFile, bagger.profile.ManifestsRequired)
	}
	if err != nil {
		bagger.addError(err.Error())
		return false
	}
	//bagger.addChecksums(relativePath, checksums)
	return true
}

func (bagger *Bagger) findTag(filename, label string) *Tag {
	if bagger.tags != nil {
		tags := bagger.tags[filename]
		if tags != nil {
			for _, tag := range tags {
				if tag.Value == label {
					return tag
				}
			}
		}
	}
	return nil
}

func (bagger *Bagger) hasRequiredTags() bool {
	ok := true
	// Avoid nil pointer errors
	tagValues := bagger.tags
	if tagValues == nil {
		tagValues = make(map[string][]*Tag)
	}
	for filename, mapOfRequiredTags := range bagger.profile.TagFilesRequired {
		for tagname, tagdesc := range mapOfRequiredTags {
			tag := bagger.findTag(filename, tagname)
			if tagdesc.Required && tag == nil {
				bagger.addError("Required tag %s for file %s is missing", tagname, filename)
				ok = false
			}
			if !tagdesc.EmptyOk && tag != nil && tag.Value == "" && len(tag.Values) == 0 {
				bagger.addError("Tag %s for file %s cannot be empty", tagname, filename)
				ok = false
			}
			if len(tagdesc.Values) > 0 && tag != nil && !util.StringListContains(tagdesc.Values, tag.Value) {
				bagger.addError("Value '%s' is not allowed for tag %s. Valid values: %s",
					tag.Value, tagname, strings.Join(tagdesc.Values, ", "))
				ok = false
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

// copyPayload copies files from PayloadDir into the bag's data
// directory.
func (bagger *Bagger) copyPayload() bool {
	files, err := fileutil.RecursiveFileList(bagger.PayloadDir)
	if err != nil {
		bagger.addError("Error listing %s: %v", bagger.PayloadDir, err)
		return false
	}
	for _, filePath := range files {
		if !bagger.addPayloadFile(filePath) {
			return false
		}
	}
	return true
}

// addPayloadFile adds one file from the source directory into the
// bag's payload (data) directory.
func (bagger *Bagger) addPayloadFile(filePath string) bool {
	var checksums map[string]string
	var err error
	// Use forward slash, even on Windows, for tar file paths and manifest entries.
	relativePath := fmt.Sprintf("data/%s", bagger.getBasePath(filePath))
	if bagger.tarWriter != nil {
		// Copy the new file into the tar archive, and keep track of its checksums
		checksums, err = bagger.tarWriter.AddToArchive(filePath, relativePath, bagger.profile.ManifestsRequired)
	} else {
		// targetPath is the path we will copy the file to
		targetPath := filepath.Join(bagger.bag.Path, "data", bagger.getBasePath(filePath))
		if fileutil.FileExists(targetPath) {
			bagger.addError(fmt.Sprintf("Cannot copy to %s: file already exists", targetPath))
			return false
		}

		// srcFile is the reader we'll copy from
		srcFile, err := os.Open(filePath)
		defer srcFile.Close()
		if err != nil {
			bagger.addError(err.Error())
			return false
		}

		// fileInfo tells us the mode the new file should have
		fileInfo, err := os.Stat(filePath)
		if err != nil {
			bagger.addError(err.Error())
			return false
		}

		targetDir := filepath.Dir(targetPath)
		if !fileutil.IsDir(targetDir) {
			err := os.MkdirAll(targetDir, 0755)
			if err != nil {
				bagger.addError(err.Error())
				return false
			}
		}

		// destFile is the writer we'll copy to
		destFile, err := os.OpenFile(targetPath, os.O_RDWR|os.O_CREATE, fileInfo.Mode())
		defer destFile.Close()
		if err != nil {
			bagger.addError(err.Error())
			return false
		}

		// Copy src to dest, and keep track of the checksums
		checksums, err = fileutil.WriteWithChecksums(srcFile, destFile, bagger.profile.ManifestsRequired)
	}
	if err != nil {
		bagger.addError(err.Error())
		return false
	}
	bagger.addChecksums(relativePath, checksums)
	return true
}

func (bagger *Bagger) getBasePath(filePath string) string {
	basePath := strings.Replace(filePath, bagger.PayloadDir+string(os.PathSeparator), "", 1)
	if strings.HasSuffix(basePath, string(os.PathSeparator)) {
		basePath = strings.TrimRight(basePath, string(os.PathSeparator))
	}
	return basePath
}

// addChecksums adds a file's checksums to the appropriate manifests.
func (bagger *Bagger) addChecksums(relativePath string, checksums map[string]string) {
	for algorithm, digest := range checksums {
		manifestFileName := fmt.Sprintf("manifest-%s.txt", algorithm)
		fileMap := bagger.bag.Manifests
		if !strings.HasPrefix(relativePath, "data/") {
			manifestFileName = fmt.Sprintf("tagmanifest-%s.txt", algorithm)
			fileMap = bagger.bag.TagManifests
		}
		manifestFile := fileMap[manifestFileName]
		if manifestFile == nil {
			manifestFile = NewFile(int64(0))
			bagger.bag.Manifests[manifestFileName] = manifestFile
		}
		manifestFile.Checksums[relativePath] = digest
	}
}

// addError adds a message to the list of bagging errors.
func (bagger *Bagger) addError(format string, a ...interface{}) {
	bagger.errors = append(bagger.errors, fmt.Sprintf(format, a...))
}
