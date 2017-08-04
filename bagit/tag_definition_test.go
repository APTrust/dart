package bagit_test

import (
	"github.com/APTrust/easy-store/bagit"
	"github.com/APTrust/easy-store/errtypes"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestNewTagDefinition(t *testing.T) {
	tagDef := bagit.NewTagDefinition("tag1", true, false, []string{"one", "two"})
	assert.Equal(t, "tag1", tagDef.Label)
	assert.True(t, tagDef.Required)
	assert.False(t, tagDef.EmptyOk)
	assert.Equal(t, 2, len(tagDef.Values))
	assert.Equal(t, "one", tagDef.Values[0])
	assert.Equal(t, "two", tagDef.Values[1])
}

func TestTagDefinitionValueIsAllowed(t *testing.T) {
	tagDef := bagit.NewTagDefinition("tag1", true, false, []string{"one", "two"})
	err := tagDef.ValueIsAllowed("one")
	assert.Nil(t, err)
	err = tagDef.ValueIsAllowed("two")
	assert.Nil(t, err)

	// Illegal value: not in list of allowed values.
	err = tagDef.ValueIsAllowed("three")
	require.NotNil(t, err)
	assert.IsType(t, &errtypes.ValueError{}, err)

	// Illegal empty value: EmptyOk is false
	err = tagDef.ValueIsAllowed("")
	require.NotNil(t, err)
	assert.IsType(t, &errtypes.EmptyError{}, err)

	// Empty value ok here
	tagDef = bagit.NewTagDefinition("tag1", true, true, nil)
	err = tagDef.ValueIsAllowed("")
	assert.Nil(t, err)

}
