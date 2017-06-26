package constants_test

import (
	"github.com/APTrust/bagit/constants"
	"github.com/stretchr/testify/assert"
	"strings"
	"testing"
)

func TestIsSupportedAlgorithm(t *testing.T) {
	for _, alg := range constants.HashAlgorithms {
		assert.True(t, constants.IsSupportedAlgorithm(alg))
		assert.True(t, constants.IsSupportedAlgorithm(strings.ToUpper(alg)))
	}
	assert.False(t, constants.IsSupportedAlgorithm("pi3.14"))
	assert.False(t, constants.IsSupportedAlgorithm(""))
}

func TestIsValidRequirementType(t *testing.T) {
	for _, reqType := range constants.RequirementTypes {
		assert.True(t, constants.IsValidRequirementType(reqType))
		assert.True(t, constants.IsValidRequirementType(strings.ToUpper(reqType)))
	}
	assert.False(t, constants.IsSupportedAlgorithm("sorta ok"))
	assert.False(t, constants.IsSupportedAlgorithm(""))
}
