package util

import (
	"encoding/json"
	"flag"
	"io/ioutil"
)

// StringListContains returns true if the list of strings contains item.
func StringListContains(list []string, item string) bool {
	if list != nil {
		for i := range list {
			if list[i] == item {
				return true
			}
		}
	}
	return false
}

// DumpJson dumps an object as JSON to the file specified by filePath.
func DumpJson(filePath string, obj interface{}) error {
	jsonBytes, err := json.MarshalIndent(obj, "", "  ")
	if err != nil {
		return err
	}
	return ioutil.WriteFile(filePath, jsonBytes, 0644)
}

// LoadJson parses JSON data from the specified file and parses it
// into an object.
func LoadJson(filePath string, obj interface{}) error {
	data, err := ioutil.ReadFile(filePath)
	if err != nil {
		return err
	}
	err = json.Unmarshal(data, obj)
	if err != nil {
		return err
	}
	return nil
}

// IsTesting returns true if we are running under "go test" (as in unit tests).
func IsTesting() bool {
	return flag.Lookup("test.v") != nil
}
