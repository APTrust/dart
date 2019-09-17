const $ = require('jquery');
const { AppSetting } = require('../../core/app_setting');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { Choice } = require('./choice');
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
        this.fields['bagItProfileId'].help = Context.y18n.__('JobPackageOp_bagItProfileId_help');
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
        this.obj.pluginId = selectedPluginId;
        if (formatName) {
            this.obj.packageFormat = formatName.trim();
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
        this.outputPath = job.packageOp.outputPath;
        this.packageName = job.packageOp.packageName;
        this.id = job.id;
        this.errors = {};
    }
}

module.exports.JobPackageOpForm = JobPackageOpForm;
