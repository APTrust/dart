package bagit_test

import (
	"github.com/APTrust/easy-store/bagit"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestNewKeyValuePair(t *testing.T) {
	item := bagit.NewKeyValuePair("key", "value")
	assert.Equal(t, "key", item.Key)
	assert.Equal(t, "value", item.Value)
}

func TestNewKeyValueCollection(t *testing.T) {
	items := bagit.NewKeyValueCollection()
	require.NotNil(t, items)
}

func TestKeyValueCollectionAppend(t *testing.T) {
	items := bagit.NewKeyValueCollection()
	items.Append("key1", "value1")
	items.Append("key2", "value2")
	items.Append("key2", "value3")
	assert.Equal(t, 2, len(items.Keys()))
	assert.Equal(t, 3, len(items.Values()))
}

func TestKeyValueCollectionFindByKey(t *testing.T) {
	items := bagit.NewKeyValueCollection()
	items.Append("key1", "value1")
	items.Append("key2", "value2")
	items.Append("key2", "value3")

	matches := items.FindByKey("key1")
	require.Equal(t, 1, len(matches))
	assert.Equal(t, "value1", matches[0].Value)

	matches = items.FindByKey("key2")
	require.Equal(t, 2, len(matches))
	assert.Equal(t, "value2", matches[0].Value)
	assert.Equal(t, "value3", matches[1].Value)

	matches = items.FindByKey("does_not_exist")
	require.Empty(t, matches)
}

func TestKeyValueCollectionFindByValue(t *testing.T) {
	items := bagit.NewKeyValueCollection()
	items.Append("key1", "value1")
	items.Append("key1", "value2")
	items.Append("key2", "value2")
	items.Append("key2", "value3")

	matches := items.FindByValue("value1")
	require.Equal(t, 1, len(matches))
	assert.Equal(t, "key1", matches[0].Key)

	matches = items.FindByValue("value2")
	require.Equal(t, 2, len(matches))
	assert.Equal(t, "key1", matches[0].Key)
	assert.Equal(t, "key2", matches[1].Key)

	matches = items.FindByValue("does_not_exist")
	require.Empty(t, matches)
}

func TestKeyValueCollectionValuesForKey(t *testing.T) {
	items := bagit.NewKeyValueCollection()
	items.Append("key1", "value1")
	items.Append("key2", "value2")
	items.Append("key2", "value3")

	matches := items.ValuesForKey("key1")
	require.Equal(t, 1, len(matches))
	assert.Equal(t, "value1", matches[0])

	matches = items.ValuesForKey("key2")
	require.Equal(t, 2, len(matches))
	assert.Equal(t, "value2", matches[0])
	assert.Equal(t, "value3", matches[1])

	matches = items.ValuesForKey("does_not_exist")
	require.Empty(t, matches)
}

func TestKeyValueCollectionFirstValueForKey(t *testing.T) {
	items := bagit.NewKeyValueCollection()
	items.Append("key1", "value1")
	items.Append("key1", "value2")
	items.Append("key1", "value3")
	items.Append("key2", "value10")
	items.Append("key2", "value20")

	assert.Equal(t, "value1", items.FirstValueForKey("key1"))
	assert.Equal(t, "value10", items.FirstValueForKey("key2"))

	require.Empty(t, items.FirstValueForKey("no_such_key"))
}

func TestKeyValueCollectionItems(t *testing.T) {
	items := bagit.NewKeyValueCollection()
	items.Append("key1", "value1")
	items.Append("key2", "value2")
	items.Append("key2", "value3")

	kvPairs := items.Items()
	assert.Equal(t, 3, len(kvPairs))
	assert.Equal(t, "key2", kvPairs[1].Key)
	assert.Equal(t, "value2", kvPairs[1].Value)
}

func TestKeyValueCollectionCount(t *testing.T) {
	items := bagit.NewKeyValueCollection()
	items.Append("key1", "value1")
	items.Append("key2", "value2")
	items.Append("key2", "value3")
	assert.Equal(t, 3, items.Count())

	items.Append("key3", "value4")
	assert.Equal(t, 4, items.Count())
}

func TestKeyValueCollectionDelete(t *testing.T) {
	items := bagit.NewKeyValueCollection()
	items.Append("key1", "value1")
	item_2_2 := items.Append("key2", "value2")
	items.Append("key2", "value3")
	assert.Equal(t, 3, items.Count())

	items.Delete(item_2_2)
	assert.Equal(t, 2, items.Count())
	matches := items.FindByKey("key2")
	for _, match := range matches {
		assert.NotEqual(t, "value2", match.Value)
	}
}

func TestKeyValueCollectionDeleteByKey(t *testing.T) {
	items := bagit.NewKeyValueCollection()
	items.Append("key1", "value1")
	items.Append("key2", "value2")
	items.Append("key2", "value3")
	assert.Equal(t, 3, items.Count())

	items.DeleteByKey("key2")
	assert.Equal(t, 1, items.Count())
	assert.Empty(t, items.FindByKey("key2"))
}
