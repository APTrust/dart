package controllers_test

import (
	"fmt"
	"net/url"
	"os"
	"testing"
)

// This is a barebones test that just proves the call
// results in an HTTP 200/OK response. This unit should
// be tested on the front end with something like Selenium.
func TestShowFileChooser(t *testing.T) {
	homedir, _ := os.UserHomeDir()
	expectedContent := []string{
		"Parent Directory",
		homedir,
	}
	params := url.Values{}
	params.Set("directory", homedir)
	location := fmt.Sprintf("/files/choose?%s", params.Encode())
	DoSimpleGetTest(t, location, expectedContent)
}
