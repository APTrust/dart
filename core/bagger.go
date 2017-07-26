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
	Bag            *Bag
	Profile        *BagItProfile
	PayloadDir     string
	TagValues      map[string]string
	ForceOverwrite bool
	tarWriter      *fileutil.TarWriter
	errors         []string
}

// NewBagger creates a new Bagger.
//
// Param bagPath is the path to the location where the bag should
// be built. This should be a directory name. The bagger will
// create the directory, if it does not already exist. If the directory
// exists, the bagger will not overwrite it, unless the forceOverwrite
// (see below) is true. If bagPath ends with ".tar", the bag will be
// created as a tar file instead of as a directory.
//
// Param payloadDir is the name of the directory containing the files to be
// bagged.
//
// Param profile is the BagIt profile that describes the requirements
// for the bag.
//
// Param tagValues is a map of tag values that will be used
// to create tag files.
//
// If param forceOverwrite is true, the bagger will delete and then
// overwrite the directory at bagPath.
func NewBagger(bagPath, payloadDir string, profile *BagItProfile, tagValues map[string]string, forceOverwrite bool) *Bagger {
	bagger := &Bagger{
		Bag:            NewBag(bagPath),
		Profile:        profile,
		PayloadDir:     payloadDir,
		TagValues:      tagValues,
		ForceOverwrite: forceOverwrite,
		errors:         make([]string, 0),
	}
	if strings.HasSuffix(bagPath, ".tar") {
		bagger.tarWriter = fileutil.NewTarWriter(bagPath)
	}
	return bagger
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

func (bagger *Bagger) BuildBag() bool {
	ok := bagger.initFileOrDir()
	if !ok {
		return false
	}
	ok = bagger.hasRequiredTags()
	if !ok {
		return false
	}
	bagger.copyPayload()

	// write tag files
	// create manifests

	return true
}

func (bagger *Bagger) hasRequiredTags() bool {
	ok := true
	// Avoid nil pointer errors
	tagValues := bagger.TagValues
	if tagValues == nil {
		tagValues = make(map[string]string)
	}
	for filename, tagmap := range bagger.Profile.TagFilesRequired {
		for tagname, tag := range tagmap {
			value, keyExists := tagValues[tagname]
			if tag.Required && !keyExists {
				bagger.addError("Required tag %s for file %s is missing", tagname, filename)
				ok = false
			}
			if !tag.EmptyOk && keyExists && value == "" {
				bagger.addError("Tag %s for file %s cannot be empty", tagname, filename)
				ok = false
			}
			if len(tag.Values) > 0 && keyExists && !util.StringListContains(tag.Values, value) {
				bagger.addError("Value '%s' is not allowed for tag %s. Valid values: %s",
					value, tagname, strings.Join(tag.Values, ", "))
				ok = false
			}
		}
	}
	return ok
}

// initFileOrDir creates the directory in which we'll assemble the bag,
// performing some safety checks along the way. Returns true on
// success, false otherwise.
func (bagger *Bagger) initFileOrDir() bool {
	if fileutil.FileExists(bagger.Bag.Path) {
		if bagger.ForceOverwrite {
			if fileutil.LooksSafeToDelete(bagger.Bag.Path, 12, 3) {
				err := os.RemoveAll(bagger.Bag.Path)
				if err != nil {
					bagger.addError("Error removing existing %s", bagger.Bag.Path, err.Error())
					return false
				}
			} else {
				bagger.addError("%s already exists and does not look safe to delete. "+
					"Choose a different path for this bag.",
					bagger.Bag.Path)
				return false
			}
		} else {
			bagger.addError("%s already exists. Use forceOverwrite=true to replace it.",
				bagger.Bag.Path)
			return false
		}
	}
	err := os.MkdirAll(bagger.Bag.Path, 0755)
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
		checksums, err = bagger.tarWriter.AddToArchive(filePath, relativePath, bagger.Profile.ManifestsRequired)
	} else {
		// targetPath is the path we will copy the file to
		targetPath := filepath.Join(bagger.Bag.Path, "data", bagger.getBasePath(filePath))
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
		checksums, err = fileutil.WriteWithChecksums(srcFile, destFile, bagger.Profile.ManifestsRequired)
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
		manifestFile := bagger.Bag.Manifests[manifestFileName]
		if manifestFile == nil {
			manifestFile = NewFile(int64(0))
			bagger.Bag.Manifests[manifestFileName] = manifestFile
		}
		manifestFile.Checksums[relativePath] = digest
	}
}

// addError adds a message to the list of bagging errors.
func (bagger *Bagger) addError(format string, a ...interface{}) {
	bagger.errors = append(bagger.errors, fmt.Sprintf(format, a...))
}

// Returns a list of error messages describing what went wrong with
// the bagging process.
func (bagger *Bagger) Errors() []string {
	return bagger.errors
}
