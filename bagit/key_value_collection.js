/**
  * KeyValueCollection represents keys and values parsed from
  * manifests and tag files. Manifest data should use the file path
  * as the key and the checksum as the value. There should be only
  * one entry for each file in a manifest.
  *
  * Tag file data should use the tag name as the key and the tag
  * value as the value. Each tag may appear multiple times in a tag
  * file, so tag names may have multiple values. This collection preserves
  * the order of those values.
*/
class KeyValueCollection {
    constructor() {
        this.items = {};
    }
    /**
     * Adds a key with the specified value to the collection.
     * You may add a key multiple times, and all values will be
     * stored in the order they were added.
     *
     * @param {string} key
     * @param {string} value
     */
    add(key, value) {
        if (!this.items.hasOwnProperty(key)) {
            this.items[key] = [];
        }
        this.items[key].push(value);
    }
    /**
     * first returns the first value for the key, or null
     * if the key is not found. Use this to when reading data
     * parsed from manifests.
     *
     * @param {string} key
     *
     * @returns {*} The first value associated with the specified
     * key, or null.
     */
    first(key) {
        var match = this.items[key];
        if (Array.isArray(match)) {
            return match[0];
        }
        return null;
    }
    /**
      * all returns all values for a key as an array of strings,
      * or null, which indicates the key is not present at all.
      * Use this when reading data parsed from tag files, where tags
      * may appear multiple times and have multiple values.
      *
      * @param {string} key
      *
      * @returns {Array} List of associated keys, or null if key is not found.
      */
    all(key) {
        if (this.items.hasOwnProperty(key)) {
            return this.items[key];
        }
        return null;
    }
    /**
      * keys returns all keys in the collection
      *
      * @returns {Array}
      */
    keys() {
        return Object.keys(this.items);
    }
    /**
      * Returns all the keys in sorted order.
      *
      * @returns {Array}
      */
    sortedKeys() {
        return this.keys().sort();
    }
}

module.exports.KeyValueCollection = KeyValueCollection;
