const { Constants } = require('../../core/constants');
const { Context } = require('../../core/context');
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
        );

        if (this.obj.protocol == 's3') {
            this.fields['login'].label = Context.y18n.__('Access Key Id')
            this.fields['password'].label = Context.y18n.__('Secret Access Key')
        }
        if (this.obj.protocol == 'sftp') {
            this.fields['bucket'].label = Context.y18n.__('Folder')
        }
    }

}

module.exports.StorageServiceForm = StorageServiceForm;
