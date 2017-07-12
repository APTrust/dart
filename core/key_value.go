package core

// KeyValuePair is a key-value pair used to represent
// tags and checksums. For checksums the key is the path of
// the file in the bag, and the value being the digest for that
// file. For example, "data/image.jpg" => "1234567890abcdef".
// For tags, the key is the tag label and the  value is the
// parsed value (the part after the colon in the tag file).
type KeyValuePair struct {
	Key   string
	Value string
}

// NewKeyValuePair returns a new KeyValuePair.
func NewKeyValuePair(key, value string) KeyValuePair {
	return KeyValuePair{
		Key:   key,
		Value: value,
	}
}

// KeyValueCollection is a searchable collection of KeyValuePair
// objects that preserves the original order in which the items
// were added. This may be important for tags, since the BagIt
// spec says we should assume tag order is important, at least
// in the bag-info.txt file. We'll assume it's important elsewhere
// as well.
//
// https://tools.ietf.org/html/draft-kunze-bagit-14#section-2.2.2
type KeyValueCollection struct {
	items []KeyValuePair
}

// NewKeyValueCollection creates a new KeyValueCollection.
func NewKeyValueCollection() *KeyValueCollection {
	return &KeyValueCollection{
		items: make([]KeyValuePair, 0),
	}
}

// Append adds a new key-value pair to the collection.
func (collection *KeyValueCollection) Append(key, value string) KeyValuePair {
	pair := NewKeyValuePair(key, value)
	collection.items = append(collection.items, pair)
	return pair
}

// Keys returns a list all unique keys in this collection.
func (collection *KeyValueCollection) Keys() []string {
	keys := make([]string, 0)
	added := make(map[string]bool)
	for _, item := range collection.items {
		if _, keyExists := added[item.Key]; !keyExists {
			keys = append(keys, item.Key)
		}
		added[item.Key] = true
	}
	return keys
}

// Values returns a list all unique values in this collection.
func (collection *KeyValueCollection) Values() []string {
	values := make([]string, 0)
	added := make(map[string]bool)
	for _, item := range collection.items {
		if _, keyExists := added[item.Value]; !keyExists {
			values = append(values, item.Value)
		}
		added[item.Value] = true
	}
	return values
}

// ValuesForKey returns a list all values for the specified key.
func (collection *KeyValueCollection) ValuesForKey(key string) []string {
	values := make([]string, 0)
	for _, item := range collection.FindByKey(key) {
		values = append(values, item.Value)
	}
	return values
}

// FirstValueForKey returns the first value for the specified key.
func (collection *KeyValueCollection) FirstValueForKey(key string) string {
	for _, item := range collection.FindByKey(key) {
		return item.Value
	}
	return ""
}

// FindByKey returns all of the matching KeyValuePair items, in the order
// they were added. Matching is case-sensitive.
func (collection *KeyValueCollection) FindByKey(key string) []KeyValuePair {
	items := make([]KeyValuePair, 0)
	for _, item := range collection.items {
		if item.Key == key {
			items = append(items, item)
		}
	}
	return items
}

// FindByValue returns all of the matching KeyValuePair items, in the order
// they were added. Matching is case-sensitive.
func (collection *KeyValueCollection) FindByValue(value string) []KeyValuePair {
	items := make([]KeyValuePair, 0)
	for _, item := range collection.items {
		if item.Value == value {
			items = append(items, item)
		}
	}
	return items
}

// Items returns all of the KeyValuePairs in the collection, in order.
func (collection *KeyValueCollection) Items() []KeyValuePair {
	return collection.items
}

// Count returns the number of items in the collection.
func (collection *KeyValueCollection) Count() int {
	return len(collection.items)
}

// Delete deletes all key-value pairs whose Key and Value
// match item.Key and item.Value. Returns the number of items
// deleted.
func (collection *KeyValueCollection) Delete(itemToDelete KeyValuePair) int {
	newItems := make([]KeyValuePair, 0)
	for _, item := range collection.items {
		if item.Key != itemToDelete.Key || item.Value != itemToDelete.Value {
			newItems = append(newItems, item)
		}
	}
	count := len(collection.items) - len(newItems)
	collection.items = newItems
	return count
}

// DeleteByKey deletes all key-value pairs whose Key
// matches the specified value. Returns the number of items
// deleted.
func (collection *KeyValueCollection) DeleteByKey(key string) int {
	newItems := make([]KeyValuePair, 0)
	for _, item := range collection.items {
		if item.Key != key {
			newItems = append(newItems, item)
		}
	}
	count := len(collection.items) - len(newItems)
	collection.items = newItems
	return count
}
