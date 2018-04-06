const path = require('path');
const { Choice } = require('./choice');
const Const = require('./constants');
const { Field } = require('./field');
const { Form } = require('./form');
const Plugins = require('../plugins/plugins');
const { Util } = require('./util');
const { ValidationResult } = require('./validation_result');

const Store = require('electron-store');
var db = new Store({name: 'storage-services'});

class StorageService {
    constructor(name) {
        this.id = Util.uuid4();
        this.name = name;
        this.description = "";
        this.protocol = "";
        this.host = "";
        this.port = "";
        this.bucket = "";
        this.loginName = "";
        this.loginPassword = "";
        this.loginExtra = "";
    }
    objectType() {
        return 'StorageService';
    }
    validate() {
        var result = new ValidationResult();
        if (Util.isEmpty(this.id)) {
            result.errors["id"] = "Id cannot be empty";
        }
        if (Util.isEmpty(this.name)) {
            result.errors["name"] = "Name cannot be empty";
        }
        if (Util.isEmpty(this.protocol)) {
            result.errors["protocol"] = "Protocol cannot be empty";
        }
        if (Util.isEmpty(this.host)) {
            result.errors["host"] = "Host cannot be empty";
        }
        if (!Util.isEmpty(this.port) && parseInt(this.port, 10) != this.port) {
            result.errors["port"] = "Port must be a whole number, or leave blank to use the default port.";
        }
        return result
    }
    save() {
        return db.set(this.id, this);
    }
    static find(id) {
        var service = null;
        var obj = db.get(id);
        if (obj != null) {
            service = new StorageService();
            Object.assign(service, obj);
        }
        return service;
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
    static storeIsEmpty() {
        return (Object.keys(db.store).length == 0);
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
            return `es.UI.Menu.storageServiceShowList('', ${limit}, ${nextOffset})`;
        }
        return "";
    }
    static previousLink(limit = 50, offset = 0) {
        if (offset > 0) {
            var prevOffset = Math.max((offset - limit), 0);
            return `es.UI.Menu.storageServiceShowList('', ${limit}, ${prevOffset})`;
        }
        return "";
    }
}

module.exports.StorageService = StorageService;
