package core_test

import (
	"github.com/APTrust/bagit/core"
	"github.com/stretchr/testify/assert"
	"strings"
	"testing"
)

func TestIsSupportedAlgorithm(t *testing.T) {
	for _, alg := range core.HashAlgorithms {
		assert.True(t, core.IsSupportedAlgorithm(alg))
		assert.True(t, core.IsSupportedAlgorithm(strings.ToUpper(alg)))
	}
	assert.False(t, core.IsSupportedAlgorithm("pi3.14"))
	assert.False(t, core.IsSupportedAlgorithm(""))
}

func TestIsValidRequirementType(t *testing.T) {
	for _, reqType := range core.RequirementTypes {
		assert.True(t, core.IsValidRequirementType(reqType))
		assert.True(t, core.IsValidRequirementType(strings.ToUpper(reqType)))
	}
	assert.False(t, core.IsSupportedAlgorithm("sorta ok"))
	assert.False(t, core.IsSupportedAlgorithm(""))
}
