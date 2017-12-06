const electron = require('electron');
var remote = require('electron').remote;
const app = remote.app;
const path = require('path');
const builtins = require(path.resolve('electron/easy/builtin_profiles'));
const AppSetting = require(path.resolve('electron/easy/app_setting'));
const BagItProfile = require(path.resolve('electron/easy/bagit_profile'));
const BagItProfileInfo = require(path.resolve('electron/easy/bagit_profile_info'));
const Choice = require(path.resolve('electron/easy/choice'));
const Const = require(path.resolve('electron/easy/constants'));
const Form = require(path.resolve('electron/easy/form'));
const Field = require(path.resolve('electron/easy/field'));
const StorageService = require(path.resolve('electron/easy/storage_service'));
const TagDefinition = require(path.resolve('electron/easy/tag_definition'));
const Util = require(path.resolve('electron/easy/util'));
const ValidationResult = require(path.resolve('electron/easy/validation_result'));

const macJunkFile = /._DS_Store$|.DS_Store$/i;
const dotFile = /\/\.[^\/]+$|\\\.[^\\]+$/;
const dotKeepFile = /\/\.keep$|\\\.keep$/i;

const Store = require('electron-store');
var db = {};
//db.appSettings = new Store({name: 'app-settings'});
//db.bagItProfiles = new Store({name: 'bagit-profiles'});
db.jobs = new Store({name: 'jobs'});
//db.storageServices = new Store({name: 'storage-services'});

// This will be set by application.js, based on current view.
var activeObject = null;


class Job {
    constructor() {
        this.id = Util.uuid4();
        this.files = [];
        this.bagItProfile = null;
        this.storageServices = [];
        this.options = new JobOptions();
        this._fullFileList = {};
    }
    clearFiles() {
        this.files = [];
        this._fullFileList = {};
    }
    getFiles() {
        return (Object.keys(this._fullFileList).sort());
    }
    hasFile(filepath) {
        return this._fullFileList[filePath] || false;
    }
    hasFiles() {
        return Object.keys(this._fullFileList).length > 0;
    }
    static filterFile(filepath, options) {
        // Return false if this file should be filtered out of the package.
        var isMacJunk = filepath.match(macJunkFile);
        if (options.skipDSStore && isMacJunk) {
            return false;
        }
        var isHidden = filepath.match(dotFile);
        var isDotKeep = filepath.match(dotKeepFile);
        if (options.skipHiddenFiles && isHidden && !isMacJunk && !isDotKeep) {
            return false;
        }
        if (options.skipDotKeep && !isMacJunk && (isHidden || isDotKeep)) {
            return false;
        }
        return true;
    }
    validate() {
        // TODO: write me!
        // Must include a file list, plus BagItProfile and/or StorageService.
        // If BagItProfile is valid, make sure it's valid.
        // If StorageService is present, make sure it's valid.
        // Make sure the working dir where we'll build the bag exists.
    }
    resetFileOptions() {
        this.options.skipDSStore = true;
        this.options.skipHiddenFiles = false;
        this.options.skipDotKeep = false;
    }
    save() {
        return db.jobs.set(this.id, this);
    }
    static find(id) {
        var job = null;
        var obj = db.jobs.get(id);
        if (obj != null) {
            job = new Job();
            Object.assign(job, obj);
        }
        return job;
    }
    delete() {
        db.jobs.delete(this.id);
        return this;
    }
}

class JobOptions {
    constructor() {
        this.skipDSStore = true;
        this.skipHiddenFiles = false;
        this.skipDotKeep = false;
    }
}



module.exports.ActiveObject = activeObject;
module.exports.AppSetting = AppSetting;
module.exports.BagItProfile = BagItProfile;
module.exports.BagItProfileInfo = BagItProfileInfo;
module.exports.Choice = Choice;
module.exports.Const = Const;
module.exports.DB = db;
module.exports.Field = Field;
module.exports.Form = Form;
module.exports.StorageService = StorageService;
module.exports.TagDefinition = TagDefinition;
module.exports.Util = Util;
module.exports.ValidationResult = ValidationResult;
