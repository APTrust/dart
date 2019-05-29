const $ = require('jquery');
const { AppSetting } = require('../../core/app_setting');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { Choice } = require('../../ui/forms/choice');
const { Constants } = require('../../core/constants');
const { Context } = require('../../core/context');
const { Field } = require('./field');
const { InternalSetting } = require('../../core/internal_setting');
const os = require('os');
const { RemoteRepository } = require('../../core/remote_repository');
const { StorageService } = require('../../core/storage_service');
const { Util } = require('../../core/util');


/**
 * SetupQuestion is a question to be asked by a setup module. DART presents
 * these questions one at a time, and the user must provide a valid answer
 * before proceeding to the next question.
 *
 * You'll typically want to copy the responses from these questions into
 * some persistent DART setting.
 *
 * @param {object} opts - An object containing setup options.
 *
 * @param {string} opts.question - The question to ask the user.
 *
 * @param {object} opts.mapsToProperty - An object that describes where the
 * initial value for this question should come from and where it should be
 * saved. See {@link SetupQuestion#mapsToProperty}, which includes a full
 * description and examples.
 *
 * @param {string} opts.error - An error message to display if the user's
 * response is invalid.
 *
 * @param {string} [opts.heading] - An optional heading to display above
 * the question.
 *
 * @param {Array<string>} [opts.options] - An optional list of allowed
 * values. If specified, the user will see an HTML select list instead of
 * a text input. The select list will contain these values and an empty
 * option.
 *
 * @param {string} [opts.dataType] - The type to which the user's response
 * should be cast. Valid values are 'number' and 'boolean'. If the dataType
 * is string you don't need to include this param, as values are strings
 * by default.
 *
 * @param {string} [opts.validator] - An optional function to validate the
 * user's response. This function takes one param, the value that the user
 * entered, and returns true or false to indicate whether it's valid. See
 * {@link SetupQuestion.getRequiredValidator},
 * {@link SetupQuestion.getPatternValidator}, and
 * {@link SetupQuestion.getIntRangeValidator}. You can also write your own
 * custom validation function.
 *
 */
class SetupQuestion extends Field {
    constructor(opts) {
        let rand = 'setup_' + Math.random().toString().replace(/^0\./, '');
        super(rand, rand, opts.question, opts.initialValue)
        /**
         * The heading that will appear above the question on the
         * page that displays the question to the user.
         *
         * @type {string}
         */
        this.heading = opts.heading;
        /**
         * The data type to which the user's response should be cast.
         * Can be 'string', 'number', or 'boolean'.
         *
         * @type {string}
         * @default 'string'
         */
        this.dataType = opts.dataType || 'string';
        /**
         * The error message to display if the user provides an invalid
         * response to the question.
         *
         * @type {string}
         */
        this.error = opts.error || Context.y18n.__("The response is not valid.");
        /**
         * A function to validate the user's response. It should return true
         * for valid responses, false otherwise.
         *
         * @type {function}
         */
        this.validator = opts.validator || function (val) { return true };
        /**
         * An object that defines what setting value or BagItProfile tag
         * value the question maps to. When the question appears, it will
         * take its initial value from the specified setting/property, or
         * from the specified BagItProfile tag value. When the user provides
         * a valid response, the value of that response will be assigned to
         * the setting/property or tag value.
         *
         * @example
         *
         * // Map this question to the value property of an AppSetting
         * opts.mapsToProperty = {
         *    type: 'AppSetting',
         *    id: 'e8a7556f-ba6b-413f-9e8a-1682a5134ebb',
         *    property: 'value'
         * }
         *
         * // Map this question to the password property of a StorageService
         * opts.mapsToProperty = {
         *    type: 'StorageService',
         *    id: 'c329c0e9-8d0c-4a8b-b7e7-45ff084a90c1',
         *    property: 'password'
         * }
         *
         * // Map this property to the Source-Organization tag in the
         * // bag-info.txt file of a BagItProfile
         * opts.mapsToProperty = {
         *    type: 'BagItProfile',
         *    id: '271b9309-2c85-4821-aeb2-7ae209c7aaa8',
         *    tagFile: 'bag-info.txt',
         *    tagName: 'Source-Organization'
         * }
         *
         * @type {object}
         */
        this.mapsToProperty = opts.mapsToProperty;
        /**
         * An optional list of allowed values to choose from. These will
         * be converted into a list of Choice objects in the base
         * {@link Field} class.
         *
         * @type {Array<string>}
         */
        this.options;

        if (Array.isArray(opts.options)) {
            this.options = opts.options;
        }
    }

    /**
     * Given a list list of strings, this builds the list of
     * {@Link Choice} objects that will appear as options in the
     * HTML select list.
     *
     * @para {Array<string>} options
     */
    set options(options) {
        this.setInitialValue();
        this.choices = Choice.makeList(options, this.value, true);
    }

    /**
     * This returns the value that the user entered in the form input
     * field. The returned value will be cast to
     * @{link SetupQuestion#dataType}.
     *
     * @returns {string|number|boolean}
     */
    readUserInput() {
        let field = this;
        let formValue = $(`#${field.id}`).val() || '';
        return Util.cast(formValue.trim(), this.dataType);
    }

    /**
     * This reads the value the user input on the form. If the input
     * is valid, assigns the value of the input to the property or
     * profile tag to which this question is mapped.
     *
     * @returns {boolean}
     */
    processResponse() {
        let value = this.readUserInput();
        if (this.validator(value)) {
            this.value = value;
            this.saveValue();
            return true;
        }
        return false;
    }

    /**
     * This sets the initial value in the HTML text input or select list.
     * The value of the setting comes from the value of the property of an
     * AppSetting, InternalSetting, RemoteRepository, StorageService, or
     * BagItProfile, as specified in  {@link SetupQuestion#mapsToProperty}
     *
     */
    setInitialValue() {
        let obj = this._getMappedObject();
        if (this.mapsToProperty.tagFile && this.mapsToProperty.tagName) {
            let tags = obj.getTagsFromFile(this.mapsToProperty.tagFile, this.mapsToProperty.tagName);
            if (!tags || tags.length == 0) {
                throw new Error(Context.y18n.__('BagIt Profile has no tags where tag file = %s and tag name = %s', this.mapsToProperty.tagFile, this.mapsToProperty.tagName));
            }
            this.value = tags[0].getValue();
        } else {
            this.value = obj[this.mapsToProperty.property];
        }
    }

    /**
     * This returns an object of type AppSetting, InternalSetting,
     * RemoteRepository, StorageService, or
     * BagItProfile, as specified in  {@link SetupQuestion#mapsToProperty}
     *
     * @private
     */
    _getMappedObject() {
        let obj;
        Context.logger.debug(`Looking for ${this.mapsToProperty.type} with id ${this.mapsToProperty.id}`);
        switch(this.mapsToProperty.type) {
        case 'AppSetting':
            obj = AppSetting.find(this.mapsToProperty.id);
            break;
        case 'BagItProfile':
            obj = BagItProfile.find(this.mapsToProperty.id);
            break;
        case 'InternalSetting':
            obj = AppSetting.find(this.mapsToProperty.id);
            break;
        case 'RemoteRepository':
            obj = RemoteRepository.find(this.mapsToProperty.id);
            break;
        case 'StorageService':
            obj = StorageService.find(this.mapsToProperty.id);
            break;
        default:
            throw new Error(Context.y18n.__("Unknown type: %s"), this.mapsToProperty.type);
        }
        if(!obj) {
            throw new Error(Context.y18n.__('Could not find object of type %s with id %s', this.mapsToProperty.type, this.mapsToProperty.id));
        }
        return obj;
    }

    /**
     * This saves the value the user entered into the HTML text input or
     * select list. The value is saved to the property of an
     * AppSetting, InternalSetting, RemoteRepository, StorageService, or
     * BagItProfile, as specified in {@link SetupQuestion#mapsToProperty}
     *
     */
    saveValue() {
        let obj = this._getMappedObject();
        if (this.mapsToProperty.tagFile && this.mapsToProperty.tagName) {
            let tags = obj.getTagsFromFile(this.mapsToProperty.tagFile, this.mapsToProperty.tagName);
            tags[0].userValue = this.value;
        } else {
            obj[this.mapsToProperty.property] = this.value;
        }
        obj.save();
    }

    /**
     * Returns a validator function that tests whether a value is empty.
     * The validator function returns false if it gets an empty value,
     * true otherwise.
     *
     * @returns {function}
     */
    static getRequiredValidator() {
        return function(value) {
            return !Util.isEmpty(value);
        }
    }

    /**
     * Returns a validator function that tests whether a value matches
     * a regular expression pattern. The validator function returns true
     * if the value matches the pattern false otherwise.
     *
     * The Constants module contains a number of pre-defined patterns,
     * including:
     *
     * - {@link Constants.RE_DOMAIN}
     * - {@link Constants.RE_EMAIL}
     * - {@link Constants.RE_FILE_PATH_POSIX}
     * - {@link Constants.RE_FILE_PATH_WINDOWS}
     * - {@link Constants.RE_FILE_PATH_ANY_OS}
     * - {@link Constants.RE_IPV4}
     *
     * @param {RegExp} pattern - The pattern to test against.
     *
     * @param {boolean} emptyOk - Are empty response allowed? Default is false.
     *
     * @returns {function}
     */
    static getPatternValidator(pattern, emptyOk = false) {
        return function(value) {
            return emptyOk && Util.isEmpty(value) || value.match(pattern) !== null;
        }
    }

    /**
     * Returns a validator function that checks whether an interger value
     * is within a given range. The function returns true or false.
     *
     * @param {number} min - The minimum value. A valid integer must be
     * greater than or equal to this.
     *
     * @param {number} max - The maximum value. A valid integer must be
     * less than or equal to this.
     *
     * @param {boolean} emptyOk - Are empty response allowed? Default is false.
     *
     * @returns {function}
     */
    static getIntRangeValidator(min, max, emptyOk = false) {
        return function(value) {
            if (emptyOk && Util.isEmpty(value)) {
                return true;
            }
            let intValue = NaN;
            if (typeof value === 'string') {
                intValue = parseInt(value, 10);
            } else if (typeof value === 'number') {
                intValue = Math.floor(value);
            }
            if (isNaN(intValue)) {
                return false
            }
            return intValue >= min && intValue <= max;
        }
    }
}

module.exports.SetupQuestion = SetupQuestion;
