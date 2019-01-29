const { BagItProfile } = require('../../core/app_setting');
const { Choice } = require('../common/choice');
const { Field } = require('../common/field');
const { Form } = require('../common/form');

class NewBagItProfileForm {

    static create() {
        // Create an empty form from an empty object.
        var form = new Form('bagItProfileForm', {});
        var profiles = BagItProfile.list({
            limit: 0,
            offset: 0,
            orderBy: 'name',
            sortDirection: 'asc'
        });
        let choices = [];
        for (let profile of profiles) {
            choices.push({
                id: profile.id,
                name: profile.name
            });
        }
        form.fields['baseProfile'] = new Field(
            `${form.formId}_baseProfile`,
            'baseProfile',
            'Base Profile',
            null
        );
        form.fields['baseProfile'].choices = Choice.makeList(
            choices,
            '',
            true
        );
        return form
    }

}

module.exports.NewBagItProfileForm = NewBagItProfileForm;
