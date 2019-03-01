const { Context } = require('./context');
const { PersistentObject } = require('./persistent_object');
const { Util } = require('./util');

/**
 * InternalSetting differs from AppSetting in two ways. First,
 * InternalSettings cannot be edited, or even seen, by users. Second,
 * while the value attribute of AppSettings are strings, the value of
 * InternalSettings can be any JavaScript object. It's up to the developer
 * to manage values.
 *
 * InternalSettings are used to track values that users don't have to
 * manage. For example, a setting called 'migrations' may contain an
 * array that lists which data migrations have already run.
 */
class InternalSetting extends PersistentObject {
    /**
     * Creates a new InternalSetting
     *
     * @param {object} opts - Object containing properties to set.
     *
     * @param {string} opts.id - A UUID in hex-string format. This is
     * the object's unique identifier.
     *
     * @param {boolean} opts.userCanDelete - Indicates whether user is
     * allowed to delete this record.
     *
     * @param {string} opts.name - The name of the setting. This should
     * be unique, to prevent confusion.
     *
     * @param {Object} value - The value of the setting. Any object type
     * is OK, but keep in mind that it will be serialized to JSON when
     * saved to the DB.
     */
    constructor(opts = {}) {
        opts.required = ['name'];
        super(opts);
        /**
          * Name is the name of the setting.
          * Setting names should be unique, to prevent confusion.
          *
          * @type {string}
          */
        this.name = opts.name || '';
        /**
          * Value is the value of the setting, which can be any
          * valid JavaScript object. Keep in mind that this object
          * will be serialized to JSON for storage, and will be
          * restored as a JSON data structure instead of as the
          * original object. (That is, it won't have any functions.)
          * It's up to the developer to manage the values of
          * InternalSetting objects.
          *
          * @type {Object}
          */
        this.value = opts.value || '';
    }

    /**
     * validate returns true or false, indicating whether this object
     * contains complete and valid data. If it returns false, check
     * the errors property for specific errors.
     *
     * @returns {boolean}
     */
    validate() {
        return super.validate();
    }

}

// Copy static methods from base class.
Object.assign(InternalSetting, PersistentObject);

module.exports.InternalSetting = InternalSetting;
