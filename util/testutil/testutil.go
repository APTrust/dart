package testutil

import (
	"fmt"
	"io/ioutil"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

// GetPathToTestData returns the absolute path to the test data directory.
func GetPathToTestData() (string, error) {
	_, filename, _, ok := runtime.Caller(0)
	if !ok {
		return "", fmt.Errorf("Rumtime cannot get caller file name.")
	}
	absFileName, err := filepath.Abs(filename)
	if err != nil {
		return "", err
	}
	testDataPath := filepath.Join(absFileName, "..", "..", "..", "testdata")
	return filepath.Abs(testDataPath)
}

func GetPathToTestBag(bagName string) (string, error) {
	dataPath, err := GetPathToTestData()
	if err != nil {
		return "", err
	}
	return filepath.Join(dataPath, "bags", bagName), nil
}

func GetPathToTestProfile(profileName string) (string, error) {
	dataPath, err := GetPathToTestData()
	if err != nil {
		return "", err
	}
	return filepath.Join(dataPath, "profiles", profileName), nil
}

// UntarTestBag untars a bag into a temporary directory for testing.
// pathToTarFile is the absolute path the tar file.
// This assumes name of untarred bag will match name of tar file,
// which is true for our APTrust requirements and our test data.
// Neither of these assumptions are safe in production. This is a
// convenience method for testing only. Returns the name of the
// temp dir, the path to the untarred bag, and an error if there
// is one.
func UntarTestBag(pathToTarFile string) (tempDir string, pathToUntarredBag string, err error) {
	tempDir, err = ioutil.TempDir("", "bagit-test")
	if err != nil {
		return "", "", fmt.Errorf("Cannot create temp dir: %v", err)
	}
	cmd := exec.Command("tar", "xf", pathToTarFile, "--directory", tempDir)
	err = cmd.Run()
	if err != nil {
		return "", "", fmt.Errorf("Cannot untar test bag into temp dir: %v", err)
	}
	nameOfOutputDir := filepath.Base(pathToTarFile)
	index := strings.LastIndex(nameOfOutputDir, ".tar")
	if index > -1 {
		nameOfOutputDir = nameOfOutputDir[0:index]
	}
	pathToUntarredBag = filepath.Join(tempDir, nameOfOutputDir)
	return tempDir, pathToUntarredBag, nil
}
