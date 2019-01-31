const { BagItProfile } = require('../../bagit/bagit_profile');
const { Choice } = require('../common/choice');
const { Constants } = require('../../core/constants');
const { Context } = require('../../core/context')
const { Field } = require('../common/field');
const { Form } = require('../common/form');

class BagItProfileForm {

    static create(bagItProfile) {
        let exclude = ["errors", "help", "type", "baseProfileId",
                       "isBuiltIn", "tags"];
        let form = new Form('bagItProfileForm', bagItProfile, exclude);

        if (!bagItProfile.userCanDelete) {
            form.fields['name'].attrs['disabled'] = true;
        }

        // Accept-BagIt-Version
        form.fields['acceptBagItVersion'].attrs['multiple'] = true;
        form.fields['acceptBagItVersion'].choices = Choice.makeList(
            Constants.BAGIT_VERSIONS,
            bagItProfile.acceptBagItVersion,
            false);

        // Allow-Fetch.txt
        form.fields['allowFetchTxt'].choices = Choice.makeList(
            Constants.YES_NO,
            bagItProfile.allowFetchTxt,
            false);
        form.fields['allowFetchTxt'].help = Context.y18n.__('BagItProfile_allowFetchTxt_help');

        // Allow misc top-level files
        form.fields['allowMiscTopLevelFiles'].choices = Choice.makeList(
            Constants.YES_NO,
            bagItProfile.allowMiscTopLevelFiles,
            false);
        form.fields['allowMiscTopLevelFiles'].help = Context.y18n.__('BagItProfile_allowMiscTopLevelFiles_help');


        // Allow misc directories
        form.fields['allowMiscDirectories'].choices = Choice.makeList(
            Constants.YES_NO,
            bagItProfile.allowMiscDirectories,
            false);
        form.fields['allowMiscDirectories'].help = Context.y18n.__('BagItProfile_allowMiscDirectories_help');


        // DEBUG
        window.BagItForm = form;
        // END DEBUG

        return form
    }

}

module.exports.BagItProfileForm = BagItProfileForm;
