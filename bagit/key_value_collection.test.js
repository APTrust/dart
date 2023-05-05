const { KeyValueCollection } = require('./key_value_collection');

test('Constructor sets initial properties', () => {
    let collection = new KeyValueCollection();
    expect(collection.items).not.toBeNull();
});

test('add() can add multiple values for each key, preserving order', () => {
    let collection = new KeyValueCollection();
    collection.add('one', '1');
    expect(collection.items['one']).toEqual(['1']);
    collection.add('one', '2');
    expect(collection.items['one']).toEqual(['1', '2']);
});

test('first() returns only the first value for the given key', () => {
    let collection = new KeyValueCollection();
    collection.add('one', '1');
    collection.add('one', '2');
    expect(collection.first('one')).toEqual('1');
});

test('first() returns null if the key is missing', () => {
    let collection = new KeyValueCollection();
    expect(collection.first('one')).toBeNull();
});

test('all() returns all values for the given key', () => {
    let collection = new KeyValueCollection();
    collection.add('one', '1');
    collection.add('one', '2');
    expect(collection.all('one')).toEqual(['1', '2']);
});

test('all() returns null if the key is missing', () => {
    let collection = new KeyValueCollection();
    expect(collection.all('one')).toBeNull();
});

test('keys() returns all keys in the collection', () => {
    let collection = new KeyValueCollection();
    collection.add('apple', 'red');
    collection.add('orange', 'orange');
    collection.add('banana', 'yellow');
    collection.add('cherry', 'red');
    let keys = collection.keys();
    expect(keys).toContain('apple');
    expect(keys).toContain('orange');
    expect(keys).toContain('banana');
    expect(keys).toContain('cherry');
});

test('sortedKeys() returns all keys in the collection in order', () => {
    let collection = new KeyValueCollection();
    collection.add('apple', 'red');
    collection.add('orange', 'orange');
    collection.add('banana', 'yellow');
    collection.add('cherry', 'red');
    expect(collection.sortedKeys()).toEqual(['apple', 'banana', 'cherry', 'orange']);
});
