const { Choice } = require('./choice');
const { Form } = require('./form');
const { PluginManager } = require('../../plugins/plugin_manager');
const { Util } = require('../../core/util');

class RemoteRepositoryForm extends Form{

    constructor(remoteRepository) {
        super('RemoteRepository', remoteRepository);
        this._init();
    }

    _init() {
        if (!this.obj.userCanDelete) {
            this.fields['name'].attrs['disabled'] = true;
        }
        if (!this.fields['url'].value) {
            this.fields['url'].attrs.placeholder = 'https://repo.example.com/api';
        }
        let repoProviders = PluginManager.getModuleCollection('Repository');
        let sortedProviders = repoProviders.sort(Util.getSortFunction('name', 'asc'));
        let choices = [];
        for (let provider of sortedProviders) {
            let description = provider.description();
            choices.push({
                id: description.id,
                name: description.name
            });
        }
        this.fields['pluginId'].choices = Choice.makeList(
            choices,
            this.obj.pluginId,
            true
        );
    }
}

module.exports.RemoteRepositoryForm = RemoteRepositoryForm;
