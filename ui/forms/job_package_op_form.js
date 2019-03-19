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
        window.formy = this;
    }

    _init() {
        this._listPackageFormats();
        this._listBagItProfiles();
    }

    _listPackageFormats() {
        let formats = [
            {
                id: 'None',
                name: 'None'
            },
            {
                id: 'BagIt',
                name: 'BagIt'
            }
        ];
        for (let writer of PluginManager.getModuleCollection('FormatWriter')) {
            let description = writer.description();
            for (let format of description.writesFormats) {
                formats.push({
                    id: description.id,
                    name: format
                });
            };
        }
        this.fields['packageFormat'].choices = Choice.makeList(
            formats,
            this.obj.pluginId,
            false
        );
    }

    _listBagItProfiles() {
        var selectedProfileId = this.obj.bagItProfile ? this.obj.bagItProfile.id : '';
        var profiles = BagItProfile.list(null, {
            limit: 0,
            offset: 0,
            orderBy: 'name',
            sortDirection: 'asc'
        });
        this.fields['bagItProfile'] = new Field(
            `${this.formId}_bagItProfile`,
            'bagItProfile',
            Context.y18n.__('BagIt Profile'),
            null
        );
        this.fields['bagItProfile'].choices = Choice.makeList(
            profiles,
            selectedProfileId,
            true
        );
        this.fields['bagItProfile'].help = Context.y18n.__('JobPackageOp_bagItProfileId_help');
    }

    // parseFromDOM() {
    //     super.parseFromDOM();
    //     // Plugin Id is the value of the selected item.
    //     // Format name is the name of the selected item.
    //     // Not pretty from a dev perspective, but it simplifies
    //     // things for the user.
    //     let selectedPluginId = this.obj.packageFormat;
    //     let formatName = $('#jobPackageOpForm_packageFormat option:selected').text();
    //     this.obj.pluginId = selectedPluginId;
    //     if (formatName) {
    //         this.obj.packageFormat = formatName.trim();
    //     }
    // }

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
    }
}

module.exports.JobPackageOpForm = JobPackageOpForm;
