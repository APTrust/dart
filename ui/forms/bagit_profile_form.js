const _ = require('lodash');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { Choice } = require('./choice');
const { Constants } = require('../../core/constants');
const { Context } = require('../../core/context')
const { Field } = require('./field');
const { Form } = require('./form');

const infoFields = {
    'infoContactEmail': 'contactEmail',
    'infoContactName': 'contactName',
    'infoExternalDescription': 'externalDescription',
    'infoIdentifier': 'bagItProfileIdentifier',
    'infoSourceOrganization': 'sourceOrganization',
    'infoVersion': 'version'
};

/**
 * This is the form for editing BagItProfiles.
 *
 * @param {BagItProfile}
 */
class BagItProfileForm extends Form {

    constructor(bagItProfile) {
        let exclude = [
            "bagItProfileInfo",
            "baseProfileId",
            "errors",
            "help",
            "isBuiltIn",
            "required",
            "tags",
            "type",
            "userCanDelete",
        ];
        super('bagItProfileForm', bagItProfile, exclude);
        this._init();
    }

    /**
     * This calls internal methods to customize the form.
     *
     * @private
     */
    _init() {
        if (!this.obj.userCanDelete) {
            this.fields['name'].attrs['disabled'] = true;
        }
        this._setBasicFields();
        this._setProfileInfoFields();
    }

    /**
     * This sets up the editable fields that are part of the
     * {@see BagItProfile} but not part of the {@see BagItProfileInfo}
     * or tags properties.
     *
     * @private
     */
    _setBasicFields() {
        // Accept-BagIt-Version
        this.fields['acceptBagItVersion'].attrs['multiple'] = true;
        this.fields['acceptBagItVersion'].attrs['required'] = true;
        this.fields['acceptBagItVersion'].choices = Choice.makeList(
            Constants.BAGIT_VERSIONS,
            this.obj.acceptBagItVersion,
            false);

        // Accept-Serialization
        this.fields['acceptSerialization'].attrs['multiple'] = true;
        this.fields['acceptSerialization'].choices = Choice.makeList(
            Object.keys(Constants.SERIALIZATION_FORMATS),
            this.obj.acceptSerialization,
            false);

        // Serialization
        this.fields['serialization'].choices = Choice.makeList(
            Constants.REQUIREMENT_OPTIONS,
            this.obj.serialization,
            false);

        // Tar dir must match name
        this.fields['tarDirMustMatchName'].choices = Choice.makeList(
            Constants.YES_NO,
            this.obj.tarDirMustMatchName,
            false);

        // Allow-Fetch.txt
        this.fields['allowFetchTxt'].choices = Choice.makeList(
            Constants.YES_NO,
            this.obj.allowFetchTxt,
            false);

        // Allow misc top-level files
        this.fields['allowMiscTopLevelFiles'].choices = Choice.makeList(
            Constants.YES_NO,
            this.obj.allowMiscTopLevelFiles,
            false);

        // Allow misc directories
        this.fields['allowMiscDirectories'].choices = Choice.makeList(
            Constants.YES_NO,
            this.obj.allowMiscDirectories,
            false);

        // Manifests required
        this.fields['manifestsRequired'].attrs['multiple'] = true;
        this.fields['manifestsRequired'].attrs['required'] = true;
        this.fields['manifestsRequired'].choices = Choice.makeList(
            Constants.DIGEST_ALGORITHMS,
            this.obj.manifestsRequired,
            false);

        // Tag manifests require
        this.fields['tagManifestsRequired'].attrs['multiple'] = true;
        this.fields['tagManifestsRequired'].choices = Choice.makeList(
            Constants.DIGEST_ALGORITHMS,
            this.obj.tagManifestsRequired,
            false);
    }

    /**
     * This sets up the form fields for the {@see BagItProfileInfo}
     * sub-object.
     *
     */
    _setProfileInfoFields() {
        // BagItProfileInfo
        for (let [fieldName, propName] of Object.entries(infoFields)) {
            this._initField(fieldName, this.obj.bagItProfileInfo[propName]);
        }
    }

    /**
     * This updates all of the values of Form.obj based on what the
     * user entered in the HTML form. After calling the super method
     * in the Form class, this hacks some values from the form into
     * the BagItProfileInfo subobjects, and cleans up some extraneous
     * properties on the BagItProfile object.
     */
    parseFromDOM() {
        super.parseFromDOM();
        for (let [fakeName, actualName] of Object.entries(infoFields)) {
            this.obj.bagItProfileInfo[actualName] = this.obj[fakeName];
            delete(this.obj[fakeName]);
        }
    }

    /**
     * Converts the form field name for a {@see BagItProfileInfo} property
     * back to the name of the actual property. For example, input
     * 'infoContactEmail' returns 'contactEmail'.
     *
     * @param {string} The name of a field on the BagItProfile form.
     *
     * @returns {string} The name of the property on the BagItProfileInfo
     * object, or undefined if the field name does not map to any property.
     *
     * @private
     */
    toObjectPropertyName(name) {
        return infoFields[name];
    }

    /**
     * Converts the name of a {@see BagItProfileInfo} property
     * to the name of a form field. For example, input
     * 'contactEmail' returns 'infoContactEmail'.
     *
     * @param {string} The name of a BagItProfileInfo property.
     *
     * @returns {string} The name of the field on the BagItProfile
     * form, or undefined if the field name does not map to any form
     * field.
     *
     * @private
     */
    toFormFieldName(name) {
        let invertedMap = _.invert(infoFields);
        return invertedMap[name];
    }
}

module.exports.BagItProfileForm = BagItProfileForm;
