const { BagItProfile } = require('../../bagit/bagit_profile');
const { Choice } = require('./choice');
const { Context } = require('../../core/context');
const { Field } = require('./field');
const { Form } = require('./form');
const { Util } = require('../../core/util');

class NewBagItProfileForm {

    static create() {
        // Create an empty form from an empty object.
        var form = new Form('bagItProfileForm', {});
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
        form.fields['baseProfile'] = new Field(
            `${form.formId}_baseProfile`,
            'baseProfile',
            Context.y18n.__('baseProfile_label'),
            null
        );
        form.fields['baseProfile'].choices = Choice.makeList(
            choices,
            '',
            false
        );
        return form
    }

}

module.exports.NewBagItProfileForm = NewBagItProfileForm;
