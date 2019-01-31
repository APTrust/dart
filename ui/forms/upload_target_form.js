const { UploadTarget } = require('../../core/upload_target');
const { Choice } = require('../common/choice');
const { Field } = require('../common/field');
const { Form } = require('../common/form');
const { PluginManager } = require('../../plugins/plugin_manager');

class UploadTargetForm {

    static create(uploadTarget) {
        var form = new Form('uploadTargetForm', uploadTarget);
        let clients = [];
        for (let client of PluginManager.getModuleCollection('NetworkClient')) {
            let description = client.description();
            for (let protocol of description.implementsProtocols) {
                clients.push(protocol);
            };
        }
        form.fields['protocol'].choices = Choice.makeList(
            clients,
            uploadTarget.protocol,
            true
        );

        return form
    }

}

module.exports.UploadTargetForm = UploadTargetForm;
