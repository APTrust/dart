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
        super('JobPackageOp', job.packageOp);
        this._init();
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
            'bagitProfile',
            Context.y18n.__('BagIt Profile'),
            null
        );
        this.fields['bagItProfile'].choices = Choice.makeList(
            profiles,
            selectedProfileId,
            true
        );

    }
}

module.exports.JobPackageOpForm = JobPackageOpForm;
