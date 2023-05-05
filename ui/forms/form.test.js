const { AppSetting } = require('../../core/app_setting');
const { Context } = require('../../core/context');
const { Form } = require('./form');
const { InternalSetting } = require('../../core/internal_setting');
const osLocale = require('os-locale');
const { Util } = require('../../core/util');

beforeEach(() => {
    Context.y18n.setLocale(osLocale.sync());
});

afterAll(() => {
    Context.y18n.setLocale(osLocale.sync());
});


test('Constructor initializes form fields', () => {
    let appSetting = new AppSetting({ name: 'fruit', value: 'apple' });
    appSetting.help = 'Help text';
    appSetting.errors['value'] = 'Value must be cherry.';
    let form = new Form('AppSetting', appSetting);
    expect(form.formId).toEqual('appSettingForm');
    expect(form.inlineForms).toEqual([]);
    expect(Object.keys(form.fields).length).toEqual(4);

    // These are on the default exclude list.
    for (let name of ['errors', 'help', 'required']) {
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
    let appSetting = new AppSetting({ name: 'fruit', value: 'apple' });
    appSetting.help = 'Help text';
    appSetting.errors['value'] = 'Value must be cherry.';
    let form = new Form('AppSetting', appSetting, []);

    // We said exclude nothing this time, so we should
    // get fields for all properties.
    expect(Object.keys(form.fields).length).toEqual(7);
    for (let name of ['errors', 'help', 'required']) {
        expect(form.fields[name]).toBeDefined();
    }
});

test('setErrors()', () => {
    let appSetting = new AppSetting({ name: 'fruit', value: 'apple' });
    let form = new Form('AppSetting', appSetting);
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

test('hasErrors()', () => {
    let appSetting = new AppSetting({ name: 'fruit', value: 'apple' });
    let form = new Form('AppSetting', appSetting);
    expect(form.hasErrors()).toBe(false);
    form.obj.errors['name'] = 'name error';
    expect(form.hasErrors()).toBe(true);
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

test('parseFromDOM()', () => {
    let appSetting = new AppSetting();
    let form = new Form('AppSetting', appSetting);

    document.body.innerHTML =
    '<form>' +
    '  <input type="text" id="appSettingForm_name" value="Homer" />' +
    '  <input type="text" id="appSettingForm_value" value="Simpson" />' +
    '  <input type="hidden" id="appSettingForm_id" value="1234" />' +
    '  <input type="hidden" id="appSettingForm_userCanDelete" value="false" />' +
    '</form>';

    form.parseFromDOM();

    // Use toBe() for exact type matching.
    expect(form.obj.name).toBe('Homer');
    expect(form.obj.value).toBe('Simpson');
    expect(form.obj.id).toBe('1234');
    expect(form.obj.userCanDelete).toBe(false);

    expect(form.changed.name.old).toEqual('');
    expect(form.changed.name.new).toEqual('Homer');
    expect(form.changed.value.old).toEqual('');
    expect(form.changed.value.new).toEqual('Simpson');
    expect(Util.looksLikeUUID(form.changed.id.old)).toBe(true);
    expect(form.changed.id.new).toEqual('1234');
    expect(form.changed.userCanDelete.old).toBe(true);
    expect(form.changed.userCanDelete.new).toBe(false);
});

test('_getLocalizedLabel()', () => {
    Context.y18n.setLocale('test_TEST');
    let internalSetting = new InternalSetting();
    let form = new Form('internalSettingForm', internalSetting);
    expect(form.fields.name.label).toEqual('Test Label');
});

test('_setRequired()', () => {
    let appSetting = new AppSetting();
    let form = new Form('AppSetting', appSetting);
    expect(form.fields.name.attrs.required).toEqual(true);
    expect(form.fields.value.attrs.required).not.toBeDefined();

    // Sanity check on our own tests
    expect(Context.y18n.locale).not.toEqual('test_TEST');
});

test('_setFieldHelpText()', () => {
    Context.y18n.setLocale('test_TEST');
    let internalSetting = new InternalSetting();
    let form = new Form('internalSettingForm', internalSetting);
    expect(form.fields.name.help).toEqual('Test help entry');

    // Special case for AppSetting
    let appSetting = new AppSetting();
    appSetting.help = 'I am what I am';
    form = new Form('AppSetting', appSetting);
    expect(form.fields.name.help).toEqual('I am what I am');

});
