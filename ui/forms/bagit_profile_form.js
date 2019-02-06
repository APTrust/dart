const { BagItProfile } = require('../../bagit/bagit_profile');
const { Choice } = require('./choice');
const { Constants } = require('../../core/constants');
const { Context } = require('../../core/context')
const { Field } = require('./field');
const { Form } = require('./form');

class BagItProfileForm extends Form {

    constructor(bagItProfile) {
        let exclude = ["errors", "help", "type", "baseProfileId",
                       "isBuiltIn", "tags"];
        super('bagItProfileForm', bagItProfile, exclude);
        this._init();
    }

    _init() {
        if (!this.obj.userCanDelete) {
            this.fields['name'].attrs['disabled'] = true;
        }

        // Accept-BagIt-Version
        this.fields['acceptBagItVersion'].attrs['multiple'] = true;
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


        // BagItProfileInfo
        let info = this.obj.bagItProfileInfo;
        this._initField('infoIdentifier', info.bagItProfileIdentifier);
        this._initField('infoContactEmail', info.contactEmail);
        this._initField('infoContactName', info.contactName);
        this._initField('infoExternalDescription', info.externalDescription);
        this._initField('infoSourceOrganization', info.sourceOrganization);
        this._initField('infoVersion', info.version);

        // Tags (alpha sort by file and name)
    }
}

module.exports.BagItProfileForm = BagItProfileForm;
