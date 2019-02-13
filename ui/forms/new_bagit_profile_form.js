const { BagItProfile } = require('../../bagit/bagit_profile');
const { Choice } = require('./choice');
const { Context } = require('../../core/context');
const { Field } = require('./field');
const { Form } = require('./form');
const { Util } = require('../../core/util');

/**
 * This form asks the user if they want to create a new {@link BagItProfile}
 * from scratch, or if they want to base their new profile on an existing
 * profile. This form appears before the form that lets the user customize
 * the new profile.
 */
class NewBagItProfileForm extends Form {

    constructor() {
        // Create an empty form from an empty object.
        super('bagItProfileForm', {});
        this._init();
    }

    /**
     * This method sets up the form's one and only field, which is a
     * select list asking whether the user wants to create a new profile
     * from scratch or to create a new profile based on an existing
     * profile.
     *
     * @private
     */
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
            `${this.formId}_baseProfile`,
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
