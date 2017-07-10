package core_test

import (
	"github.com/APTrust/bagit/core"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestNewKeyValuePair(t *testing.T) {
	item := core.NewKeyValuePair("key", "value")
	assert.Equal(t, "key", item.Key)
	assert.Equal(t, "value", item.Value)
}

func TestNewKeyValueCollection(t *testing.T) {
	items := core.NewKeyValueCollection()
	require.NotNil(t, items)
}

func TestKeyValueCollectionAppend(t *testing.T) {
	items := core.NewKeyValueCollection()
	items.Append("key1", "value1")
	items.Append("key2", "value2")
	items.Append("key2", "value3")
	assert.Equal(t, 2, len(items.Keys()))
	assert.Equal(t, 3, len(items.Values()))
}

func TestKeyValueCollectionFindByKey(t *testing.T) {
	items := core.NewKeyValueCollection()
	items.Append("key1", "value1")
	items.Append("key2", "value2")
	items.Append("key2", "value3")

	matches := items.FindByKey("key1")
	require.Equal(t, 1, len(matches))
	assert.Equal(t, "value1", matches[0].Value)

	matches = items.FindByKey("key2")
	require.Equal(t, 2, len(matches))
	assert.Equal(t, "value2", matches[0].Value)
	assert.Equal(t, "value3", matches[0].Value)

	matches = items.FindByKey("does_not_exist")
	require.Empty(t, matches)
}

func TestKeyValueCollectionFindByValue(t *testing.T) {
	items := core.NewKeyValueCollection()
	items.Append("key1", "value1")
	items.Append("key1", "value2")
	items.Append("key2", "value2")
	items.Append("key2", "value3")

	matches := items.FindByValue("value1")
	require.Equal(t, 1, len(matches))
	assert.Equal(t, "key1", matches[0].Key)

	matches = items.FindByKey("value2")
	require.Equal(t, 2, len(matches))
	assert.Equal(t, "key1", matches[0])
	assert.Equal(t, "key2", matches[0])

	matches = items.FindByValue("does_not_exist")
	require.Empty(t, matches)
}
