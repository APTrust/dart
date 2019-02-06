const { UploadTarget } = require('../../core/upload_target');
const { Choice } = require('./choice');
const { Field } = require('./field');
const { Form } = require('./form');
const { PluginManager } = require('../../plugins/plugin_manager');

class UploadTargetForm extends Form{

    constructor(uploadTarget) {
        super('uploadTargetForm', uploadTarget);
        this._init();
    }

    _init() {
        let clients = [];
        for (let client of PluginManager.getModuleCollection('NetworkClient')) {
            let description = client.description();
            for (let protocol of description.implementsProtocols) {
                clients.push(protocol);
            };
        }
        this.fields['protocol'].choices = Choice.makeList(
            clients,
            this.obj.protocol,
            true
        );
    }

}

module.exports.UploadTargetForm = UploadTargetForm;
