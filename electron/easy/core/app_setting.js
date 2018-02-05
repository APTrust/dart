const path = require('path');
const Field = require('./field');
const Form = require('./form');
const Util = require('./util');
const ValidationResult = require('./validation_result');

const Store = require('electron-store');
var db = new Store({name: 'app-settings'});

const requiredSettings = ["Institution Domain", "Bagging Directory"];

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
        if (this.isRequired()) {
            form.fields['name'].attrs['disabled'] = true;
            if (this.name == "Institution Domain") {
                form.fields['name'].help = "Set this to the value of your organization's internet domain. This is a required setting. You cannot delete it. You can only change its value."
            } else if (this.name = "Bagging Directory") {
                form.fields['name'].help = "Where should Easy Store create bags?"
            }
        }
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
    isRequired() {
        for (var name of requiredSettings) {
            if (this.name == name) {
                return true;
            }
        }
        return false;
    }
    save() {
        return db.set(this.id, this);
    }
    static findByName(name) {
        for (var key in db.store) {
            var setting = db.store[key];
            if (setting.name == name) {
                return setting;
            }
        }
        return null;
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

    // TODO: Much of getStore, list, nextLink, and previousLink
    // is common to AppSetting, BagItProfile, Job, and StorageService.
    // Factor this out to common code.
    static getStore() {
        return db.store;
    }
    static list(limit = 50, offset = 0) {
        var items = [];
        var allItems = Util.sortByName(db.store);
        var end = Math.min((offset + limit), allItems.length);
        for (var i = offset; i < end; i++) {
            items.push(allItems[i]);
        }
        return items;
    }
    static nextLink(limit = 50, offset = 0) {
        if (offset + limit < Object.keys(db.store).length) {
            var nextOffset = offset + limit
            return `appSettingShowList('', ${limit}, ${nextOffset})`;
        }
        return "";
    }
    static previousLink(limit = 50, offset = 0) {
        if (offset > 0) {
            var prevOffset = Math.max((offset - limit), 0);
            return `appSettingShowList('', ${limit}, ${prevOffset})`;
        }
        return "";
    }
}
