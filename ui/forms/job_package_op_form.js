const { Choice } = require('./choice');
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

}

module.exports.JobPackageOpForm = JobPackageOpForm;
