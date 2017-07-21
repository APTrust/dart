package core

import (
	"fmt"
	"github.com/APTrust/bagit/util/fileutil"
	"os"
)

type Bagger struct {
	Bag            *Bag
	Profile        *BagItProfile
	PayloadDir     string
	TagValues      map[string]string
	ForceOverwrite bool
	errors         []string
}

// NewBagger creates a new Bagger.
//
// Param bagPath is the path to the location where the bag should
// be built. This should be a directory name. The bagger will
// create the directory, if it does not already exist. If the directory
// exists, the bagger will not overwrite it, unless the forceOverwrite
// (see below) is true.
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
	return &Bagger{
		Bag:            NewBag(bagPath),
		Profile:        profile,
		PayloadDir:     payloadDir,
		TagValues:      tagValues,
		ForceOverwrite: forceOverwrite,
		errors:         make([]string, 0),
	}
}

/*

- Validate Profile
- Validate that all defaults are present
- Include progress callback or io.Writer for writing progress messages
- Add all payload files to bag in working dir
- Build tag files
- Create manifests

- Tar bag if serialization is required and serlialization format is tar?
- Provide a way of specifying tag files and where to put them?
- Parse existing tag files, and skip defaults if they're already defined in existing tag files?

*/

func (bagger *Bagger) BuildBag() bool {
	ok := bagger.makeDir()
	if !ok {
		return false
	}
	return true
}

// makeDir creates the directory in which we'll assemble the bag,
// performing some safety checks along the way. Returns true on
// success, false otherwise.
func (bagger *Bagger) makeDir() bool {
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

// addError adds a message to the list of bagging errors.
func (bagger *Bagger) addError(format string, a ...interface{}) {
	bagger.errors = append(bagger.errors, fmt.Sprintf(format, a...))
}
