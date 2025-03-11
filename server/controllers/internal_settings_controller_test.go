package controllers_test

import (
	"testing"

	"github.com/APTrust/dart-runner/core"
	"github.com/stretchr/testify/assert"
)

func TestInternalSettingsList(t *testing.T) {
	defer core.ClearDartTable()
	s1 := core.NewInternalSetting("Internal Setting 1", "Value 1-1-1")
	s2 := core.NewInternalSetting("Internal Setting 2", "Value 2-2-2")
	assert.NoError(t, core.ObjSave(s1))
	assert.NoError(t, core.ObjSave(s2))

	expected := []string{
		"Internal Settings",
		"Name",
		"Value",
		"New",
		"Internal Setting 1",
		"Value 1-1-1",
		"Internal Setting 2",
		"Value 2-2-2",
	}

	DoSimpleGetTest(t, "/internal_settings", expected)
}
