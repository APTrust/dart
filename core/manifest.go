package core

import (
	"path"
	"strings"
)

type Manifest struct {
	Path   string
	Type   string
	Values map[string]string
}

// Algorithm returns the manifest's hashing algorithm, based
// on the manifest name. For example, manifest-md5.txt returns
// md5, while tag_manifest-sha256.txt returns sha256.
func (manifest *Manifest) Algorithm() string {
	alg := ""
	parts := strings.Split(path.Base(manifest.Path), "-")
	if len(parts) > 1 {
		parts = strings.Split(parts[1], ".")
		if len(parts) > 1 {
			alg = parts[0]
		}
	}
	return alg
}
