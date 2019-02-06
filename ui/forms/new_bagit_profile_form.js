const { BagItProfile } = require('../../bagit/bagit_profile');
const { Choice } = require('./choice');
const { Context } = require('../../core/context');
const { Field } = require('./field');
const { Form } = require('./form');
const { Util } = require('../../core/util');

class NewBagItProfileForm extends Form {

    constructor() {
        // Create an empty form from an empty object.
        super('bagItProfileForm', {});
        this._init();
    }

    _init() {
        var profiles = BagItProfile.list(null, {
            limit: 0,
            offset: 0,
            orderBy: 'name',
            sortDirection: 'asc'
        });
        let choices = [{
            id:'',
            name: Context.y18n.__('baseProfile_empty_label')
        }];
        for (let profile of profiles) {
            choices.push({
                id: profile.id,
                name: Util.truncateString(profile.description, 60).replace(/\.$/, '')
            });
        }
        this.fields['baseProfile'] = new Field(
            `${form.formId}_baseProfile`,
            'baseProfile',
            Context.y18n.__('baseProfile_label'),
            null
        );
        this.fields['baseProfile'].choices = Choice.makeList(
            choices,
            '',
            false
        );
    }
}

module.exports.NewBagItProfileForm = NewBagItProfileForm;
