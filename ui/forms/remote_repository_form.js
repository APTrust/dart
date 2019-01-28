const { RemoteRepository } = require('../../core/remote_repository');
const { Choice } = require('../common/choice');
const { Field } = require('../common/field');
const { Form } = require('../common/form');
const { PluginManager } = require('../../plugins/plugin_manager');
const { Util } = require('../../core/util');

class RemoteRepositoryForm {

    static create(remoteRepository) {
        var form = new Form('remoteRepositoryForm', remoteRepository);

        // Customize
        if (!remoteRepository.userCanDelete) {
            form.fields['name'].attrs['disabled'] = true;
        }
        form.fields['name'].help = remoteRepository.help;

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
        form.fields['pluginId'].choices = Choice.makeList(
            choices,
            remoteRepository.pluginId,
            true
        );
        return form
    }

}

module.exports.RemoteRepositoryForm = RemoteRepositoryForm;
