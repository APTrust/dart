const { Context } = require('./context');
const { PersistentObject } = require('./persistent_object');
const { Util } = require('./util');

/**
 * AppSetting is a simple, storable name-value pair that users
 * can edit through the DART UI. For example, the AppSetting called
 * "Organization Name" stores the name of the user's organization.
 *
 * AppSetting names and values should be strings. Also note that
 * AppSetting inherits the property userCanDelete from PersistentObject.
 * That value is true by default, but you may want to set it to false
 * for settings you don't want users to delete.
 */
class AppSetting extends PersistentObject {
    /**
     * Creates a new AppSetting
     *
     * @param {object} opts - Object containing properties to set.
     *
     * @param {string} opts.id - A UUID in hex-string format. This is
     * the object's unique identifier.
     *
     * @param {boolean} opts.userCanDelete - Indicates whether user is
     * allowed to delete this record.
     *
     * @param {string} opts.name - The name of the setting. This should be
     * unique, to prevent conflicts.
     *
     * @param {string} opts.value - The value of the setting.
     */
    constructor(opts = {}) {
        opts.type = 'AppSetting';
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
          * Value is the value of the setting.
          * It should be a string, so users can edit it in the DART UI.
          *
          * @type {string}
          */
        this.value = opts.value || '';
        /**
          * This is an optional description telling the user what this
          * AppSetting means, or what it does. If provided, this will
          * appear in the DART UI when the user edits the AppSetting.
          *
          * @type {string}
          */
        this.help = opts.help || '';
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

// Copy static methods from base
Object.assign(AppSetting, PersistentObject);

module.exports.AppSetting = AppSetting;
