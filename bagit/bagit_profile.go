package bagit

import (
	"fmt"
	"github.com/APTrust/easy-store/util"
	"strings"
)

// BagItProfile is a slightly modified version of bagit-profiles at
// https://github.com/ruebot/bagit-profiles.
// In this version, the Tag-Files-Required list is not a list of
// strings, but a list of TagFile objects, like the BagInfo object
// in bagit-profiles. This lets us validate the presence and value
// of specific tags in any tag file the same way bagit-profile lets
// us validate tags in the bagit.txt file.
type BagItProfile struct {
	// AcceptBagItVersion is a list of BagIt versions to accept.
	// For example, ["0.96", "0.97"]
	AcceptBagItVersion []string `json:"Accept-BagIt-Version"`
	// AcceptSerialization is a list of BagIt serialization formats
	// to accept. For example, ["application/zip", "application/tar"]
	AcceptSerialization []string `json:"Accept-Serialization"`
	// AllowFetchTxt indicates whether we allow a fetch.txt file in the bag.
	AllowFetchTxt bool `json:"Allow-Fetch.txt"`
	// AllowMiscTopLevelFiles indicates whether we allow files in the top-level
	// directory other than payload manifests and tag manifests.
	AllowMiscTopLevelFiles bool `json:"Allow-Misc-Top-Level-Files"`
	// AllowMiscDirectories indicates whether we allow miscellaneous
	// directories to exist outside the data directory. These non-data
	// directories often contain custom tag files whose checksums may
	// not appear in any manifest.
	AllowMiscDirectories bool `json:"Allow-Misc-Directories"`
	// BagItProfileInfo contains descriptive information about this
	// BagIt profile.
	BagItProfileInfo BagItProfileInfo `json:"BagIt-Profile-Info"`
	// ManifestsRequired is a list of payload manifests that must be
	// in the bag. Values in this list are the algoritm names. So, to
	// require manifest-md5.txt and manifest-sha256.txt, the list
	// should contain just ["md5", "sha256"].
	ManifestsRequired []string `json:"Manifests-Required"`
	// Serialization can be "required", "optional" or "forbidden."
	Serialization string `json:"Serialization"`
	// TagFiles is a list of TagFile objects, each of which describes
	// a tag file in the bag. Here, we differ from the bagit-profiles
	// specification in that ALL tag files in the list are objects
	// instead of strings, and the objects describe tags we expect to
	// find in the files. Since TagFile objects have a Required property,
	// we omit bagit-profiles' TagFilesRequired, because that would be
	// redundant.
	TagFilesRequired map[string]map[string]*TagDefinition `json:"Tag-Files-Required"`
	// TagManifestsRequired is a list of required tag manifests. Like
	// ManifestsRequired, the list contains only the names of the
	// required hashing algorithms. E.g. ["md5", "sha256"]
	TagManifestsRequired []string `json:"Tag-Manifests-Required"`
}

// BagItProfileInfo contains some basic info about the bagit profile
// and the sender, adhering to the structure of bagit-profiles at
// https://github.com/ruebot/bagit-profiles.
type BagItProfileInfo struct {
	// BagItProfileIdentifier is the URL where this bagit profile can be found.
	BagItProfileIdentifier string `json:"BagIt-Profile-Identifier"`
	// ContactEmail is the email address of the person maintaining this
	// bagit profile.
	ContactEmail string `json:"Contact-Email"`
	// ContactName is the name of the person maintaining this profile.
	ContactName string `json:"Contact-Name"`
	// ExternamDescription describes what this profile is for. For example,
	// "BagIt profile for ingesting content into APTrust."
	ExternalDescription string `json:"External-Description"`
	// SourceOrganization is the name of the organization maintaining this
	// profile.
	SourceOrganization string `json:"Source-Organization"`
	// Version is the version number of this profile. E.g "1.2".
	Version string `json:"Version"`
}

// LoadBagItProfile loads a BagItProfile from the specified file path.
func LoadBagItProfile(filePath string) (*BagItProfile, error) {
	profile := &BagItProfile{}
	err := util.LoadJson(filePath, profile)
	// The BagIt profile spec is a little out of alignment with our
	// TagDefinition struct, so we have to copy the tag names into
	// the struct from the JSON map keys.
	if err == nil && profile != nil && profile.TagFilesRequired != nil {
		for _, tagDefinitions := range profile.TagFilesRequired {
			for tagName, tagDef := range tagDefinitions {
				tagDef.Label = tagName
			}
		}
	}
	return profile, err
}

// Validate returns a list of errors describing why the profile is not
// valid. If the profile is valid, this returns an empty slice.
func (profile *BagItProfile) Validate() []error {
	errs := make([]error, 0)
	if profile.AcceptBagItVersion == nil || len(profile.AcceptBagItVersion) == 0 {
		errs = append(errs, fmt.Errorf("Accept-BagIt-Version must accept at least one BagIt version."))
	}
	if profile.ManifestsRequired == nil || len(profile.ManifestsRequired) == 0 {
		errs = append(errs, fmt.Errorf("Manifests-Required must require at least one algorithm."))
	}
	if _, hasBagit := profile.TagFilesRequired["bagit.txt"]; !hasBagit {
		errs = append(errs, fmt.Errorf("Tag-Files-Required is missing bagit.txt."))
	}
	if _, hasBaginfo := profile.TagFilesRequired["bag-info.txt"]; !hasBaginfo {
		errs = append(errs, fmt.Errorf("Tag-Files-Required is missing bag-info.txt."))
	}
	return errs
}

// RequiredTagDirs returns a list of directories that the profile says
// should contain required tag files. The validator should permit the
// presence of these directories even when AllowMiscDirectories is false.
func (profile *BagItProfile) RequiredTagDirs() []string {
	dirs := make([]string, 0)
	for filename := range profile.TagFilesRequired {
		// Use "/" instead of os.PathSeparator, because BagIt spec
		// says manifests and tag manifests should use "/".
		parts := strings.Split(filename, "/")
		if len(parts) > 1 && !util.StringListContains(dirs, parts[0]) {
			dirs = append(dirs, parts[0])
		}
	}
	return dirs
}
