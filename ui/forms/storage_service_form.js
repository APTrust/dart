const { StorageService } = require('../../core/storage_service');
const { Choice } = require('./choice');
const { Field } = require('./field');
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
    }

}

module.exports.StorageServiceForm = StorageServiceForm;
