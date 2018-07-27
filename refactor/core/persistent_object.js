const { Context } = require('./context');
const { JsonStore } = require('./json_store');

/**
 * PersistentObject is the base class for all objects that we want
 * to be able to persist to a JsonStore (a plain-text JSON file in
 * which we can save, retrieve, update, and delete individual objects.)
 *
 * @param {string} name - The class name of the object.
 */
class PersistentObject {
    constructor(name) {

    }
}
