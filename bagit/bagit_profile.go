package bagit

import (
	"fmt"
	"github.com/APTrust/dart/constants"
	"github.com/APTrust/dart/util"
	"sort"
	"strings"
)

// TagFilesRequired => RequiredTags

// BagItProfile is a modified version of bagit-profiles at
// https://github.com/ruebot/bagit-profiles.
type BagItProfile struct {
	// Id is a UUID (as string) that uniquely identifies this profile.
	Id string `json:"id"`
	// Name is the name of the profile, usually set by the user in
	// the EasyStore UI
	Name string `json:"name"`
	// AcceptBagItVersion is a list of BagIt versions to accept.
	// For example, ["0.96", "0.97"]
	AcceptBagItVersion []string `json:"acceptBagItVersion"`
	// AcceptSerialization is a list of BagIt serialization formats
	// to accept. For example, ["application/zip", "application/tar"]
	AcceptSerialization []string `json:"acceptSerialization"`
	// AllowFetchTxt indicates whether we allow a fetch.txt file in the bag.
	AllowFetchTxt bool `json:"allowFetchTxt"`
	// AllowMiscTopLevelFiles indicates whether we allow files in the top-level
	// directory other than payload manifests and tag manifests.
	AllowMiscTopLevelFiles bool `json:"allowMiscTopLevelFiles"`
	// AllowMiscDirectories indicates whether we allow miscellaneous
	// directories to exist outside the data directory. These non-data
	// directories often contain custom tag files whose checksums may
	// not appear in any manifest.
	AllowMiscDirectories bool `json:"allowMiscDirectories"`
	// BagItProfileInfo contains descriptive information about this
	// BagIt profile.
	BagItProfileInfo BagItProfileInfo `json:"bagItProfileInfo"`
	// BaseProfileId is the UUID (as string) of the profile on which
	// this profile is based. When you clone a profile in the EasyStore
	// UI, this is id of the profile you cloned.
	BaseProfileId string
	// IsBuiltIn indicates whether this is one of EasyStore's built-in
	// profiles.
	IsBuiltIn bool
	// ManifestsRequired is a list of payload manifests that must be
	// in the bag. Values in this list are the algoritm names. So, to
	// require manifest-md5.txt and manifest-sha256.txt, the list
	// should contain just ["md5", "sha256"].
	ManifestsRequired []string `json:"manifestsRequired"`
	// RequiredTags is a list of TagDefinition objects, each of which defines
	// a tag, its name, which file it must appear in, etc.
	RequiredTags []*TagDefinition `json:"requiredTags"`
	// Serialization can be "required", "optional" or "forbidden."
	Serialization string `json:"serialization"`
	// TagManifestsRequired is a list of required tag manifests. Like
	// ManifestsRequired, the list contains only the names of the
	// required hashing algorithms. E.g. ["md5", "sha256"]
	TagManifestsRequired []string `json:"tagManifestsRequired"`
}

// BagItProfileInfo contains some basic info about the bagit profile
// and the sender, adhering to the structure of bagit-profiles at
// https://github.com/ruebot/bagit-profiles.
type BagItProfileInfo struct {
	// BagItProfileIdentifier is the URL where this bagit profile can be found.
	BagItProfileIdentifier string `json:"bagItProfileIdentifier"`
	// ContactEmail is the email address of the person maintaining this
	// bagit profile.
	ContactEmail string `json:"contactEmail"`
	// ContactName is the name of the person maintaining this profile.
	ContactName string `json:"contactName"`
	// ExternalDescription describes what this profile is for. For example,
	// "BagIt profile for ingesting content into APTrust."
	ExternalDescription string `json:"externalDescription"`
	// SourceOrganization is the name of the organization maintaining this
	// profile.
	SourceOrganization string `json:"sourceOrganization"`
	// Version is the version number of this profile. E.g "1.2".
	Version string `json:"Version"`
}

// LoadBagItProfile loads a BagItProfile from the specified file path.
func LoadBagItProfile(filePath string) (*BagItProfile, error) {
	profile := &BagItProfile{}
	err := util.LoadJson(filePath, profile)
	return profile, err
}

// Validate returns a list of errors describing why the profile is not
// valid. If the profile is valid, this returns an empty slice.
func (profile *BagItProfile) Validate() []error {
	errs := make([]error, 0)
	if profile.AcceptBagItVersion == nil || len(profile.AcceptBagItVersion) == 0 {
		errs = append(errs, fmt.Errorf("acceptBagItVersion must accept at least one BagIt version."))
	}
	if profile.ManifestsRequired == nil || len(profile.ManifestsRequired) == 0 {
		errs = append(errs, fmt.Errorf("manifestsRequired must require at least one algorithm."))
	}
	if !profile.RequiresTagFile("bagit.txt") {
		errs = append(errs, fmt.Errorf("requiredTags is missing requirements for bagit.txt."))
	}
	if !profile.RequiresTagFile("bag-info.txt") {
		errs = append(errs, fmt.Errorf("requiredTags is missing requirements for bag-info.txt."))
	}
	return errs
}

func (profile *BagItProfile) RequiresTagFile(filename string) bool {
	for _, tag := range profile.RequiredTags {
		if tag.TagFile == filename {
			return true
		}
	}
	return false
}

// RequiredTagDirs returns a list of directories that the profile says
// should contain required tag files. The validator should permit the
// presence of these directories even when AllowMiscDirectories is false.
func (profile *BagItProfile) RequiredTagDirs() []string {
	dirs := make([]string, 0)
	for _, tag := range profile.RequiredTags {
		// Use "/" instead of os.PathSeparator, because BagIt spec
		// says manifests and tag manifests should use "/".
		parts := strings.Split(tag.TagFile, "/")
		if len(parts) > 1 && !util.StringListContains(dirs, parts[0]) {
			dirs = append(dirs, parts[0])
		}
	}
	return dirs
}

// SortedTagFileNames returns a sorted list of required tag file
// names. Each item in the list is the relative path of a tag file
// within the bag. E.g. bag-info.txt or dpn-tags/dpn-info.txt.
func (profile *BagItProfile) SortedTagFilesRequired() []string {
	fileMap := make(map[string]bool)
	for _, tag := range profile.RequiredTags {
		fileMap[tag.TagFile] = true
	}
	fileNames := make([]string, len(fileMap))
	i := 0
	for fileName := range fileMap {
		fileNames[i] = fileName
		i++
	}
	sort.Strings(fileNames)
	return fileNames
}

// SortedTagNames returns a sorted list of tag names with the
// specified required tag file. Param relFilePath should be something like
// "bag-info.txt" or "dpn-tags/dpn-info.txt". If relFilePath is not a
// required tag file, this will return an empty list.
func (profile *BagItProfile) SortedTagNames(relFilePath string) []string {
	nameMap := make(map[string]bool)
	for _, tag := range profile.RequiredTags {
		if tag.TagFile == relFilePath {
			nameMap[tag.TagName] = true
		}
	}
	tagNames := make([]string, len(nameMap))
	i := 0
	for tagName := range nameMap {
		tagNames[i] = tagName
		i++
	}
	sort.Strings(tagNames)
	return tagNames
}

func (profile *BagItProfile) TagsForFile(relFilePath string) []*TagDefinition {
	tags := make([]*TagDefinition, 0)
	for _, tag := range profile.RequiredTags {
		if tag.TagFile == relFilePath {
			tags = append(tags, tag)
		}
	}
	return tags
}

func (profile *BagItProfile) FindTagDef(relFilePath, tagName string) *TagDefinition {
	var matchingTag *TagDefinition
	for _, tag := range profile.RequiredTags {
		if tag.TagFile == relFilePath && tag.TagName == tagName {
			matchingTag = tag
		}
	}
	return matchingTag
}

func (profile *BagItProfile) CanBeTarred() bool {
	return util.StringListContains(profile.AcceptSerialization, "application/tar") ||
		util.StringListContains(profile.AcceptSerialization, "application/x-tar")
}

func (profile *BagItProfile) MustBeTarred() bool {
	return profile.CanBeTarred() && profile.Serialization == constants.REQUIRED
}
