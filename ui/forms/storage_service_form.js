const { Constants } = require('../../core/constants');
const { Choice } = require('./choice');
const { Form } = require('./form');
const { PluginManager } = require('../../plugins/plugin_manager');

class StorageServiceForm extends Form{

    constructor(storageService) {
        super('StorageService', storageService);
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
        this.fields['allowsUpload'].choices = Choice.makeList(
            Constants.YES_NO,
            this.obj.allowsUpload,
            true
        );
        this.fields['allowsDownload'].choices = Choice.makeList(
            Constants.YES_NO,
            this.obj.allowsDownload,
            true
        );    }

}

module.exports.StorageServiceForm = StorageServiceForm;
