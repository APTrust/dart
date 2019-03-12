const { Choice } = require('./choice');
const { Field } = require('./field');
const { Form } = require('./form');
const { PackageOperation } = require('../../core/package_operation');
const { PluginManager } = require('../../plugins/plugin_manager');

/**
 * PackageOperationForm can present and parse the form that allows
 * the user to specify how files should be packaged for a job.
 * The fields in this form map to properties on the Job's
 * packageOp property, which is a  {@link PackageOperation}
 * object.
 */
class PackageOperationForm extends Form {

    constructor(packageOp) {
        super('PackageOperation', packageOp);
        this._init();
    }

    _init() {
        let formats = [];
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
            true
        );
        console.log(this.fields['packageFormat'].choices);
    }

}

module.exports.PackageOperationForm = PackageOperationForm;
