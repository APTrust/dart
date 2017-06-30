package core

import (
	"github.com/APTrust/bagit/util/fileutil"
	"strings"
)

type Bag struct {
	Name         string
	Path         string
	Payload      map[string]*File
	Manifests    map[string]*File
	TagManifests map[string]*File
	TagFiles     map[string]*File
}

func NewBag(name, filePath string) *Bag {
	return &Bag{
		Name: name,
		Path: filePath,
	}
}

func (bag *Bag) AddFileFromSummary(fileSummary *fileutil.FileSummary) {
	file := &File{Size: fileSummary.Size}
	if strings.HasPrefix(fileSummary.RelPath, "tagmanifest-") {
		bag.TagManifests[fileSummary.RelPath] = file
	} else if strings.HasPrefix(fileSummary.RelPath, "manifest-") {
		bag.Manifests[fileSummary.RelPath] = file
	} else if strings.HasPrefix(fileSummary.RelPath, "data/") {
		bag.Payload[fileSummary.RelPath] = file
	} else {
		bag.TagFiles[fileSummary.RelPath] = file
	}
}
