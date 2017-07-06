package core

import (
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

func (bag *Bag) AddFileFromSummary(fileSummary *fileutil.FileSummary) {
	file := NewFile(fileSummary.Size)
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

func (bag *Bag) GetChecksum(filePath, algorighm string) (string, error) {
	return "", nil
}

func (bag *Bag) GetTagValue(tagName string) ([]string, error) {
	return nil, nil
}

func (bag *Bag) GetTagValueInFile(filePath, tagName string) ([]string, error) {
	return nil, nil
}
