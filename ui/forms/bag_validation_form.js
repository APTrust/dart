const $ = require('jquery');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { Choice } = require('./choice');
const { Constants } = require('../../core/constants');
const { Context } = require('../../core/context');
const { Field } = require('./field');
const { Form } = require('./form');
const { Job } = require('../../core/job');

/**
 * BagValidationForm can present and parse the form that allows
 * the user to specify a bag to be validated and a profile to validate
 * against.
 */
class BagValidationForm extends Form {

    constructor(job) {
        super('Job', job);
        console.log(job)
        this._init();
    }

    _init() {
        this._listBagItProfiles();
    }

    _listBagItProfiles() {
        console.log(this);
        var profiles = BagItProfile.list(null, {
            limit: 0,
            offset: 0,
            orderBy: 'name',
            sortDirection: 'asc'
        });
        this.fields['bagItProfile'].choices = Choice.makeList(
            profiles,
            this.obj.bagItProfileId,
            true
        );
        this.fields['bagItProfile'].help = Context.y18n.__('JobValidationOp_bagItProfileId_help');
    }

}

module.exports.BagValidationForm = BagValidationForm;
