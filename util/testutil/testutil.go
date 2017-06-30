package testutil

import (
	"fmt"
	"path/filepath"
	"runtime"
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
