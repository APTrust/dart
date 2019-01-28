const { PluginManager } = require('../../plugins/plugin_manager');
const { RemoteRepository } = require('../../core/remote_repository');
const { RemoteRepositoryForm } = require('./remote_repository_form');

test('create()', () => {
    let aptrustPlugin = PluginManager.getModuleCollection('Repository')[0];
    let opts = {
        id: '00000000-0000-0000-0000-000000000000',
        name: 'Test Remote Repo',
        url: 'https://example.com/repo',
        userId: 'homer',
        apiToken: 'tokenXYZ',
        loginExtra: '987654321',
        pluginId: aptrustPlugin.description().id,
        userCanDelete: true
    };
    let remoteRepository = new RemoteRepository(opts);

    let form = RemoteRepositoryForm.create(remoteRepository);

    expect(Object.keys(form.fields).length).toEqual(8);
    expect(form.fields['id']).toBeDefined();
    expect(form.fields['id'].name).toEqual('id');
    expect(form.fields['id'].value).toEqual('00000000-0000-0000-0000-000000000000');

    expect(form.fields['name']).toBeDefined();
    expect(form.fields['name'].name).toEqual('name');
    expect(form.fields['name'].value).toEqual('Test Remote Repo');
    expect(form.fields['name'].attrs['disabled']).not.toBeDefined();

    expect(form.fields['url']).toBeDefined();
    expect(form.fields['url'].name).toEqual('url');
    expect(form.fields['url'].value).toEqual('https://example.com/repo');

    expect(form.fields['userId']).toBeDefined();
    expect(form.fields['userId'].name).toEqual('userId');
    expect(form.fields['userId'].value).toEqual('homer');

    expect(form.fields['apiToken']).toBeDefined();
    expect(form.fields['apiToken'].name).toEqual('apiToken');
    expect(form.fields['apiToken'].value).toEqual('tokenXYZ');

    expect(form.fields['loginExtra']).toBeDefined();
    expect(form.fields['loginExtra'].name).toEqual('loginExtra');
    expect(form.fields['loginExtra'].value).toEqual('987654321');

    expect(form.fields['userCanDelete']).toBeDefined();
    expect(form.fields['userCanDelete'].name).toEqual('userCanDelete');
    expect(form.fields['userCanDelete'].value).toEqual(true);

    expect(form.fields['pluginId']).toBeDefined();
    expect(form.fields['pluginId'].name).toEqual('pluginId');
    expect(form.fields['pluginId'].value).toEqual(aptrustPlugin.description().id);

    // If user cannot delete this setting, make name editing is disabled.
    remoteRepository.userCanDelete = false;
    form = RemoteRepositoryForm.create(remoteRepository);
    expect(form.fields['userCanDelete'].value).toEqual(false);
    expect(form.fields['name'].attrs['disabled']).toBeDefined();
});
