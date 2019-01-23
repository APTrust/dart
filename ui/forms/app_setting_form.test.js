const { AppSetting } = require('../../core/app_setting');
const { AppSettingForm } = require('./app_setting_form');

test('create()', () => {
    let appSetting = new AppSetting({ name: 'Name 1', value: 'Value 1'});
    appSetting.help = 'Help for app setting';

    let form = AppSettingForm.create(appSetting);

    expect(Object.keys(form.fields).length).toEqual(4);
    expect(form.fields['id']).toBeDefined();
    expect(form.fields['id'].name).toEqual('id');

    expect(form.fields['name']).toBeDefined();
    expect(form.fields['name'].name).toEqual('name');
    expect(form.fields['name'].value).toEqual('Name 1');
    expect(form.fields['name'].help).toEqual('Help for app setting');
    expect(form.fields['name'].attrs['disabled']).not.toBeDefined();

    expect(form.fields['value']).toBeDefined();
    expect(form.fields['value'].name).toEqual('value');
    expect(form.fields['value'].value).toEqual('Value 1');

    expect(form.fields['userCanDelete']).toBeDefined();
    expect(form.fields['userCanDelete'].name).toEqual('userCanDelete');
    expect(form.fields['userCanDelete'].value).toEqual(true);

    // If user cannot delete this setting, make name editing is disabled.
    appSetting.userCanDelete = false;
    form = AppSettingForm.create(appSetting);
    expect(form.fields['userCanDelete'].value).toEqual(false);
    expect(form.fields['name'].attrs['disabled']).toBeDefined();
});
