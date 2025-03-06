package controllers_test

import (
	"testing"
)

func TestAboutShow(t *testing.T) {
	expectedContent := []string{
		"Version",
		"App Location",
		"Data Location",
		"Log File",
		"Academic Preservation Trust",
		"GitHub",
	}

	DoSimpleGetTest(t, "/about", expectedContent)
}
