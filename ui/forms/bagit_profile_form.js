const { BagItProfile } = require('../../core/app_setting');
const { Choice } = require('../common/choice');
const { Field } = require('../common/field');
const { Form } = require('../common/form');

class BagItProfileForm {

    static create(bagItProfile) {
        var form = new Form('bagItProfileForm', bagItProfile);

        if (!bagItProfile.userCanDelete) {
            form.fields['name'].attrs['disabled'] = true;
        }

        return form
    }

}

module.exports.BagItProfileForm = BagItProfileForm;
