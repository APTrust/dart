const $ = require('jquery');
const { AppSetting } = require('../../core/app_setting');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { Choice } = require('./choice');
const { Constants } = require('../../core/constants');
const { Context } = require('../../core/context');
const { Field } = require('./field');
const { Form } = require('./form');
const { PluginManager } = require('../../plugins/plugin_manager');

/**
 * JobPackageOpForm can present and parse the form that allows
 * the user to specify how files should be packaged for a job.
 */
class JobPackageOpForm extends Form {

    constructor(job) {
        super('JobPackageOp', new JobPackageOp(job));
        this._init();
    }

    _init() {
        this._listPackageFormats();
        this._listBagItProfiles();
        this._listBagItSerializations();
        this._initOutputPath();
    }

    _listPackageFormats() {
        let formats = [
            {
                id: 'None',
                name: Context.y18n.__('Choose One')
            },
            {
                id: 'BagIt',
                name: 'BagIt'
            }
        ];

        /*
         * A.D. June 7, 2022 - 
         * 
         * Stop showing tar package format because it's producing empty output.
         * We can re-enable this when it's working, but it will be some time before
         * we have the resources to fully look into this.
         * 
        for (let writer of PluginManager.getModuleCollection('FormatWriter')) {
            let description = writer.description();
            for (let format of description.writesFormats) {
                if (format != 'directory') {
                    formats.push({
                        id: description.id,
                        name: format
                    });
                }
            };
        }
        */

        this.fields['packageFormat'].choices = Choice.makeList(
            formats,
            this.obj.pluginId,
            false
        );
    }

    _listBagItProfiles() {
        var profiles = BagItProfile.list(null, {
            limit: 0,
            offset: 0,
            orderBy: 'name',
            sortDirection: 'asc'
        });
        this.fields['bagItProfileId'].choices = Choice.makeList(
            profiles,
            this.obj.bagItProfileId,
            true
        );
        this.fields['bagItProfileId'].label = Context.y18n.__('JobPackageOp_bagItProfileId_label');
        this.fields['bagItProfileId'].help = Context.y18n.__('JobPackageOp_bagItProfileId_help');
    }

    _listBagItSerializations() {
        let none = Context.y18n.__('None');
        let formats = [{ id: '', name: none }];
        let profile = null;
        if (this.fields.bagItProfileId.value) {
            profile = BagItProfile.find(this.fields.bagItProfileId.value);
        }
        if (profile == null) {
            // Profile was deleted
            this.fields.bagItProfileId.value = '';
        } else {
            let accepted = [];
            for (let mimeType of profile.acceptSerialization) {
                let extension = Constants.SUPPORTED_SERIALIZATION_EXTENSIONS[mimeType];
                if (extension) { 
                    accepted.push(extension);
                }
            }
            if (accepted.length == 1 && profile.serialization == 'required') {
                // Only one format, and it's required
                formats = accepted;
                this.obj.bagItSerialization = accepted[0];
            } else {
                // Multiple formats suppored and/or serialization optional.
                formats = formats.concat(accepted.sort());
            }
        }
        this.fields['bagItSerialization'].choices = Choice.makeList(
            formats,
            this.obj.bagItSerialization,
            false
        );
        this.fields['bagItSerialization'].help = Context.y18n.__('JobPackageOp_bagItSerialization_help');
    }

    _initOutputPath() {
        if (!this.fields['outputPath'].value) {
            let setting = AppSetting.firstMatching("name", "Bagging Directory");
            if (setting) {
                this.fields['outputPath'].value = setting.value;
            }
        }
    }

    parseFromDOM() {
        super.parseFromDOM();
        let selectedPluginId = this.obj.packageFormat;
        let formatName = $('#jobPackageOpForm_packageFormat option:selected').text();
        let serialization = $('#jobPackageOpForm_bagItSerialization option:selected').text();
        this.obj.pluginId = selectedPluginId;
        if (formatName) {
            this.obj.packageFormat = formatName.trim();
        }
        if (serialization) {
            this.obj.bagItSerialization = serialization.trim();
        } else {
            this.obj.bagItSerialization = '';
        }
    }

}

/**
 * This is a convenience class to summarize a subset of Job
 * and PackageOperation data that appears on the the Job
 * Packaging form. This object is not saved per se; its
 * properties are copied to and from the Job and PackageOperation
 * form.
 */
class JobPackageOp {
    constructor(job) {
        this.packageFormat = job.packageOp.packageFormat || 'BagIt';
        this.pluginId = job.packageOp.pluginId || 'BagIt';
        this.bagItProfileId = job.bagItProfile ? job.bagItProfile.id : '';
        this.bagItSerialization = job.packageOp.bagItSerialization;
        this.outputPath = job.packageOp.outputPath;
        this.packageName = job.packageOp.packageName;
        this.id = job.id;
        this.errors = {};
    }
}

module.exports.JobPackageOpForm = JobPackageOpForm;
