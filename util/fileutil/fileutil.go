package fileutil

import (
	"crypto/md5"
	"crypto/sha1"
	"crypto/sha256"
	"crypto/sha512"
	"fmt"
	"github.com/APTrust/bagit/constants"
	"github.com/APTrust/bagit/errtypes"
	"golang.org/x/crypto/md4"
	"hash"
	"io"
	"os"
	"os/user"
	"path/filepath"
	"strings"
)

// FileExists returns true if the file at path exists.
func FileExists(filePath string) bool {
	_, err := os.Stat(filePath)
	if err != nil && os.IsNotExist(err) {
		return false
	}
	return true
}

// IsFile returns true if the object at filePath is a file.
func IsFile(filePath string) bool {
	stat, err := os.Stat(filePath)
	if err == nil && stat != nil {
		return !stat.IsDir()
	}
	return false
}

// IsDir returns true if the object at filePath is a directory.
func IsDir(filePath string) bool {
	stat, err := os.Stat(filePath)
	if err == nil && stat != nil {
		return stat.IsDir()
	}
	return false
}

// Expands the tilde in a directory path to the current
// user's home directory. For example, on Linux, ~/data
// would expand to something like /home/josie/data
func ExpandTilde(filePath string) (string, error) {
	if strings.Index(filePath, "~") < 0 {
		return filePath, nil
	}
	usr, err := user.Current()
	if err != nil {
		return "", err
	}
	separator := string(os.PathSeparator)
	homeDir := usr.HomeDir + separator
	expandedDir := strings.Replace(filePath, "~"+separator, homeDir, 1)
	return expandedDir, nil
}

// RecursiveFileList returns a list of all files in path dir
// and its subfolders. It does not return directories.
func RecursiveFileList(dir string) ([]string, error) {
	files := make([]string, 0)
	err := filepath.Walk(dir, func(filePath string, f os.FileInfo, err error) error {
		if f != nil && f.IsDir() == false {
			files = append(files, filePath)
		}
		return nil
	})
	return files, err
}

// Returns true if the path specified by dir has at least minLength
// characters and at least minSeparators path separators. This is
// for testing paths you want pass into os.RemoveAll(), so you don't
// wind up deleting "/" or "/etc" or something catastrophic like that.
func LooksSafeToDelete(dir string, minLength, minSeparators int) bool {
	separator := string(os.PathSeparator)
	separatorCount := (len(dir) - len(strings.Replace(dir, separator, "", -1)))
	return len(dir) >= minLength && separatorCount >= minSeparators
}

// ParseManifestName returns a manifestType and algorithm if filePath
// looks like a manifest name. For example, "tagmanifest-sha256.txt"
// would return constants.TAG_MANIFEST and "sha256", while
// "manifest-md5.txt" would return constants.PAYLOAD_MANIFEST, "md5".
// Non-manifest files will return two empty strings.
func ParseManifestName(filePath string) (manifestType string, algorithm string) {
	// Regex??
	if strings.Contains(filePath, "/") || strings.Contains(filePath, string(os.PathSeparator)) {
		return "", ""
	}
	parts := strings.Split(filePath, ".")
	if len(parts) > 1 && parts[1] == "txt" {
		if strings.HasPrefix(parts[0], "tagmanifest-") {
			manifestType = constants.TAG_MANIFEST
		} else if strings.HasPrefix(parts[0], "manifest-") {
			manifestType = constants.PAYLOAD_MANIFEST
		}
		nameAndAlg := strings.Split(parts[0], "-")
		if len(nameAndAlg) > 1 {
			algorithm = nameAndAlg[1]
		} else {
			manifestType = ""
		}
	}
	return manifestType, algorithm
}

// CalculateChecksums calculates checksums for a file, based on the algorithms
// specified in the algorithms param. Supported algorithm names are specified
// in constants.go. The return value is a map in which the key is the algorithm
// name and the value is the hash digest in the form of a hex string.
//
// This function will calculate all of the digests in a single read of the
// file.
//
// Example:
//
// CalculateChecksums("/path/to/file.txt", []string{ MD5, SHA256, SHA384 })
//
// Returns a map that looks like this:
//
// "md5"    => "0123456789ABCDEF"
// "sha256" => "FEDCBA0987654321"
// "sha512" => "ABCDEF1234567890"
func CalculateChecksums(reader io.Reader, algorithms []string) (map[string]string, error) {
	if len(algorithms) == 0 {
		return nil, errtypes.NewValueError("You must specify at least one algorithm.")
	}
	hashes := make([]io.Writer, len(algorithms))
	for i, alg := range algorithms {
		if !constants.IsSupportedAlgorithm(alg) {
			return nil, errtypes.NewValueError("Unsupported algorithm: %s", alg)
		}
		if alg == constants.MD4 {
			hashes[i] = md4.New()
		} else if alg == constants.MD5 {
			hashes[i] = md5.New()
		} else if alg == constants.SHA1 {
			hashes[i] = sha1.New()
		} else if alg == constants.SHA224 {
			hashes[i] = sha256.New224()
		} else if alg == constants.SHA256 {
			hashes[i] = sha256.New()
		} else if alg == constants.SHA384 {
			hashes[i] = sha512.New384()
		} else if alg == constants.SHA512 {
			hashes[i] = sha512.New()
		}
	}
	multiWriter := io.MultiWriter(hashes...)
	_, err := io.Copy(multiWriter, reader)
	if err != nil {
		return nil, err
	}
	digests := make(map[string]string)
	for i, alg := range algorithms {
		_hash := hashes[i].(hash.Hash)
		digests[alg] = fmt.Sprintf("%x", _hash.Sum(nil))
	}
	return digests, nil
}
