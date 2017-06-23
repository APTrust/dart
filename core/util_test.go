package core_test

import (
	"github.com/APTrust/bagit/core"
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestStringListContains(t *testing.T) {
	list := []string{"apple", "orange", "banana"}
	assert.True(t, util.StringListContains(list, "orange"))
	assert.False(t, util.StringListContains(list, "wedgie"))
	// Don't panic on nil list
	assert.False(t, util.StringListContains(nil, "mars"))
}
