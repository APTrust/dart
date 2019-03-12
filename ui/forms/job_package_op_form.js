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
        super('JobPackageOp', JobPackageOpForm.getCustomObject(job));
        this._init();
        window.formy = this;
    }

    static getCustomObject(job) {
        return {
            packageFormat: job.packageFormat,
            pluginId: job.pluginId,
            bagItProfileId: job.bagItProfile ? job.bagItProfile.id : '',
            outputPath: job.outputPath,
            packageName: job.packageName,
            id: job.id
        }
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
            this.obj.packageFormat,
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

module.exports.JobPackageOpForm = JobPackageOpForm;
