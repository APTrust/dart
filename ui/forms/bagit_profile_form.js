const { BagItProfile } = require('../../bagit/bagit_profile');
const { Choice } = require('./choice');
const { Constants } = require('../../core/constants');
const { Context } = require('../../core/context')
const { Field } = require('./field');
const { Form } = require('./form');

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

        // Accept-Serialization
        form.fields['acceptSerialization'].attrs['multiple'] = true;
        form.fields['acceptSerialization'].choices = Choice.makeList(
            Object.keys(Constants.SERIALIZATION_FORMATS),
            bagItProfile.acceptSerialization,
            false);

        // Serialization
        form.fields['serialization'].choices = Choice.makeList(
            Constants.REQUIREMENT_OPTIONS,
            bagItProfile.serialization,
            false);

        // Tar dir must match name
        form.fields['tarDirMustMatchName'].choices = Choice.makeList(
            Constants.YES_NO,
            bagItProfile.tarDirMustMatchName,
            false);

        // Allow-Fetch.txt
        form.fields['allowFetchTxt'].choices = Choice.makeList(
            Constants.YES_NO,
            bagItProfile.allowFetchTxt,
            false);

        // Allow misc top-level files
        form.fields['allowMiscTopLevelFiles'].choices = Choice.makeList(
            Constants.YES_NO,
            bagItProfile.allowMiscTopLevelFiles,
            false);

        // Allow misc directories
        form.fields['allowMiscDirectories'].choices = Choice.makeList(
            Constants.YES_NO,
            bagItProfile.allowMiscDirectories,
            false);

        // Manifests required
        form.fields['manifestsRequired'].attrs['multiple'] = true;
        form.fields['manifestsRequired'].choices = Choice.makeList(
            Constants.DIGEST_ALGORITHMS,
            bagItProfile.manifestsRequired,
            false);

        // Tag manifests require
        form.fields['tagManifestsRequired'].attrs['multiple'] = true;
        form.fields['tagManifestsRequired'].choices = Choice.makeList(
            Constants.DIGEST_ALGORITHMS,
            bagItProfile.tagManifestsRequired,
            false);


        // BagItProfileInfo

        // Tags (alpha sort by file and name)

        // DEBUG
        window.BagItForm = form;
        // END DEBUG

        return form
    }

}

module.exports.BagItProfileForm = BagItProfileForm;
