const { BagItProfile } = require('../../bagit/bagit_profile');
const { Choice } = require('./choice');
const { Constants } = require('../../core/constants');
const { Context } = require('../../core/context');
const { Field } = require('./field');
const { Form } = require('./form');
const path = require('path');
const { ValidationOperation } = require('../../core/validation_operation');

/**
 * BagValidationForm can present and parse the form that allows
 * the user to specify a bag to be validated and a profile to validate
 * against.
 */
class BagValidationForm extends Form {

    constructor(job) {
        super('Job', job);
        this._init();
    }

    _init() {
        this.fields['pathToBag'] = new Field("pathToBag", "pathToBag", "Choose a file...", "");
        this._listBagItProfiles();
    }

    _listBagItProfiles() {
        var profiles = BagItProfile.list(null, {
            limit: 0,
            offset: 0,
            orderBy: 'name',
            sortDirection: 'asc'
        });
        this.fields['bagItProfile'].choices = Choice.makeList(
            profiles,
            Constants.BUILTIN_PROFILE_IDS['empty'],
            false
        );
        this.fields['bagItProfile'].help = Context.y18n.__('Choose a profile against which to validate this bag. If you just want to validate against the BagIt specification, choose the Empty Profile.');
    }

    parseFromDOM() {
        // This is required for jest tests.
        if ($ === undefined) {
            var $ = require('jquery');
        }
        let profileId = $('#jobForm_bagItProfile').val();
        this.obj.bagItProfile = BagItProfile.find(profileId)
        this.obj.validationOp = new ValidationOperation();
        let files = document.getElementById('pathToBag').files
        let filename = files[0].path;
        // If user selected directory, use the dir name.
        if (files.length > 1) {
            filename = path.dirname(files[0].path);
        }
        this.obj.validationOp.pathToBag = filename;
    }
}

module.exports.BagValidationForm = BagValidationForm;
