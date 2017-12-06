const path = require('path');
const Field = require(path.resolve('electron/easy/field'));
const Form = require(path.resolve('electron/easy/form'));
const Util = require(path.resolve('electron/easy/util'));
const ValidationResult = require(path.resolve('electron/easy/validation_result'));


const Store = require('electron-store');
var db = new Store({name: 'app-settings'});

module.exports = class AppSetting {
    constructor(name, value) {
        this.id = Util.uuid4();
        this.name = name;
        this.value = value;
    }
    objectType() {
        return 'AppSetting';
    }
    validate() {
        var result = new ValidationResult();
        if (Util.isEmpty(this.id)) {
            result.errors["id"] = "Id cannot be empty";
        }
        if (Util.isEmpty(this.name)) {
            result.errors["name"] = "Name cannot be empty";
        }
        return result
    }
    toForm() {
        var form = new Form('appSettingForm');
        form.fields['id'] = new Field('appSettingId', 'id', 'id', this.id);
        form.fields['name'] = new Field('appSettingName', 'name', 'Name', this.name);
        form.fields['value'] = new Field('appSettingValue', 'value', 'Value', this.value);
        return form
    }
    static fromForm() {
        var name = $('#appSettingName').val().trim();
        var value = $('#appSettingValue').val().trim();
        var setting = new AppSetting(name, value);
        setting.id = $('#appSettingId').val().trim();
        return setting
    }
    save() {
        return db.set(this.id, this);
    }
    static find(id) {
        var setting = null;
        var obj = db.get(id);
        if (obj != null) {
            setting = new AppSetting();
            Object.assign(setting, obj);
        }
        return setting;
    }
    delete() {
        db.delete(this.id);
        return this;
    }
    static getStore() {
        return db.store;
    }
}
