const { BagItProfile } = require('../../bagit/bagit_profile');
const { Choice } = require('../common/choice');
const { Constants } = require('../../core/constants');
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
        form.fields['allowFetchTxt'].help = "Are fetch.txt files allowed? These files contain URLs of files that should be part of the bag. DART does not yet support packaging or validating fetch.txt files.";

        // Allow misc top-level files
        form.fields['allowMiscTopLevelFiles'].choices = Choice.makeList(
            Constants.YES_NO,
            bagItProfile.allowMiscTopLevelFiles,
            false);
        form.fields['allowMiscTopLevelFiles'].help = "Can the bag contain files in the top-level directory other than manifests, tag manifests, and standard tag files like bagit.txt and bag-info.txt?";


        // Allow misc directories
        form.fields['allowMiscDirectories'].choices = Choice.makeList(
            Constants.YES_NO,
            bagItProfile.allowMiscDirectories,
            false);
        form.fields['allowMiscDirectories'].help = "Can the bag contain directories other than 'data' in the top-level directory?";


        // DEBUG
        window.BagItForm = form;
        // END DEBUG

        return form
    }

}

module.exports.BagItProfileForm = BagItProfileForm;
