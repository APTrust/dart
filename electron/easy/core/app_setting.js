const path = require('path');
const { Field } = require('./field');
const { Form } = require('./form');
const { Util } = require('./util');
const { ValidationResult } = require('./validation_result');

const Store = require('electron-store');
var db = new Store({name: 'app-settings'});

class AppSetting {
    constructor(name, value) {
        this.id = Util.uuid4();
        this.name = name;
        this.value = value;

        // Set this to false if your setup requires this setting
        // to be present.
        this.userCanDelete = true;
        this.help = "";
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
    save() {
        return db.set(this.id, this);
    }
    static findByName(name) {
        for (var key in db.store) {
            var obj = db.store[key];
            if (obj.name == name) {
                var setting = new AppSetting();
                Object.assign(setting, obj);
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
            return `es.UI.Menu.appSettingShowList('', ${limit}, ${nextOffset})`;
        }
        return "";
    }
    static previousLink(limit = 50, offset = 0) {
        if (offset > 0) {
            var prevOffset = Math.max((offset - limit), 0);
            return `es.UI.Menu.appSettingShowList('', ${limit}, ${prevOffset})`;
        }
        return "";
    }
}

module.exports.AppSetting = AppSetting;
