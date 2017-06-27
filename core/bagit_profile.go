package core

import (
//	"encoding/json"
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
	AcceptSerialization []string `json:"Accept-BagIt-Serialization"`
	// AllowFetchTxt indicates whether we allow a fetch.txt file in the bag.
	AllowFetchTxt bool `json:"Allow-Fetch.txt"`
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
	TagFilesRequired []*TagFile `json:"Tag-Files-Required"`
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
	BagItProfileIdentifier string `json:"BagIt-Profile-Info"`
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
	return nil, nil
}

func (profile *BagItProfile) Validate() []error {
	return nil
}
