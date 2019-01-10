const { AppSetting } = require('../../core/app_setting');
const { Field } = require('./field');
const { Form } = require('./form');
const { Util } = require('../../core/util');

test('Constructor initializes form fields', () => {
    let appSetting = new AppSetting('fruit', 'apple');
    appSetting.help = 'Help text';
    appSetting.errors['value'] = 'Value must be cherry.';
    let form = new Form('appSettingForm', appSetting);
    expect(form.formId).toEqual('appSettingForm');
    expect(form.inlineForms).toEqual([]);
    expect(Object.keys(form.fields).length).toEqual(4);

    // These are on the default exclude list.
    for (let name of ['errors', 'help', 'type']) {
        expect(form.fields[name]).not.toBeDefined();
    }

    for (let name of ['id', 'name', 'value', 'userCanDelete']) {
        let field = form.fields[name];
        let value = appSetting[name];
        expect(field).toBeDefined();
        expect(field.id).toEqual('appSettingForm_' + name);
        expect(field.name).toEqual(name);
        expect(field.label).toEqual(Util.camelToTitle(name));
        expect(field.value).toEqual(value);
        if (name === 'value') {
            expect(field.error).toEqual('Value must be cherry.');
        } else {
            expect(field.error).not.toBeDefined();
        }
    }
});

test('Constructor initializes form fields with custom exclude', () => {
    let appSetting = new AppSetting('fruit', 'apple');
    appSetting.help = 'Help text';
    appSetting.errors['value'] = 'Value must be cherry.';
    let form = new Form('appSettingForm', appSetting, []);

    // We said exclude nothing this time, so we should
    // get fields for all properties.
    expect(Object.keys(form.fields).length).toEqual(7);
    for (let name of ['errors', 'help', 'type']) {
        expect(form.fields[name]).toBeDefined();
    }
});

test('setErrors()', () => {
    let appSetting = new AppSetting('fruit', 'apple');
    let form = new Form('appSettingForm', appSetting);
    for (let name of ['id', 'name', 'value', 'userCanDelete']) {
        let field = form.fields[name];
        expect(field.error).not.toBeDefined();
    }

    form.obj.errors['id'] = 'id error'
    form.obj.errors['name'] = 'name error'
    form.obj.errors['value'] = 'value error';
    form.obj.errors['userCanDelete'] = 'userCanDelete error'

    form.setErrors();

    for (let name of ['id', 'name', 'value', 'userCanDelete']) {
        let field = form.fields[name];
        expect(field.error).toEqual(`${name} error`);
    }
});

test('castNewValueToType()', () => {
    let obj = {
        str: 'string 1',
        number: 1,
        bool: false,
        errors: {}   // required to build form
    };
    let form = new Form('objForm', obj);

    // Use toBe() for exact type matching.
    expect(form.castNewValueToType(obj.str, 'string 2')).toBe('string 2');
    expect(form.castNewValueToType(obj.number, '2')).toBe(2);
    expect(form.castNewValueToType(obj.bool, 'true')).toBe(true);
});
