const { BagItProfile } = require('../../bagit/bagit_profile');
const { Choice } = require('../common/choice');
const { Field } = require('../common/field');
const { Form } = require('../common/form');
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
            name: 'None - I want to build a new profile from scratch'
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
            'Base New BagIt Profile On...',
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
