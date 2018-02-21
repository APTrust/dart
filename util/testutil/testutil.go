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

func GetPathToTestFile(fileName string) (string, error) {
	dataPath, err := GetPathToTestData()
	if err != nil {
		return "", err
	}
	return filepath.Join(dataPath, "files", fileName), nil
}

func GetPathToTestFileDir() (string, error) {
	dataPath, err := GetPathToTestData()
	if err != nil {
		return "", err
	}
	return filepath.Join(dataPath, "files"), nil
}

func GetPathToJob(filename string) (string, error) {
	dataPath, err := GetPathToTestData()
	if err != nil {
		return "", err
	}
	return filepath.Join(dataPath, "jobs", filename), nil
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
    if runtime.GOOS == "windows" {
		// mingw tar util can't figure out windows paths that begin with "c:"
		// http://mingw-users.1079350.n2.nabble.com/tar-doesn-t-accept-Windows-style-path-names-with-drive-letters-td7583282.html
		driveLetter := string(pathToTarFile[0])
	    winTarFilePath := "/" + driveLetter + pathToTarFile[2:len(pathToTarFile)]
		driveLetter = string(tempDir[0])
		winTempDir := "/" + driveLetter + tempDir[2:len(tempDir)]
		winTarFilePath = strings.Replace(winTarFilePath, "\\", "/", -1)
		winTempDir = strings.Replace(winTempDir, "\\", "/", -1)
		cmd := exec.Command("tar", "xf", winTarFilePath, "--directory", winTempDir)
		err = cmd.Run()
		if err != nil {
			return "", "", fmt.Errorf("Cannot untar test bag '%s' into temp dir '%s': %v", winTarFilePath, winTempDir, err)
		}
	} else {
		cmd := exec.Command("tar", "xf", pathToTarFile, "--directory", tempDir)
		err = cmd.Run()
		if err != nil {
			return "", "", fmt.Errorf("Cannot untar test bag '%s' into temp dir '%s': %v", pathToTarFile, tempDir, err)
		}
	}
	nameOfOutputDir := filepath.Base(pathToTarFile)
	index := strings.LastIndex(nameOfOutputDir, ".tar")
	if index > -1 {
		nameOfOutputDir = nameOfOutputDir[0:index]
	}
	pathToUntarredBag = filepath.Join(tempDir, nameOfOutputDir)
	return tempDir, pathToUntarredBag, nil
}
