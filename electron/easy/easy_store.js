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
const Field = require(path.resolve('electron/easy/field'));
const Form = require(path.resolve('electron/easy/form'));
const Job = require(path.resolve('electron/easy/job'));
const StorageService = require(path.resolve('electron/easy/storage_service'));
const TagDefinition = require(path.resolve('electron/easy/tag_definition'));
const Util = require(path.resolve('electron/easy/util'));
const ValidationResult = require(path.resolve('electron/easy/validation_result'));

// This will be set by application.js, based on current view.
var ActiveObject = null;

// Cache some HTML views for navigating back/forward
var ViewCache = {};

module.exports.ActiveObject = ActiveObject;
module.exports.AppSetting = AppSetting;
module.exports.BagItProfile = BagItProfile;
module.exports.BagItProfileInfo = BagItProfileInfo;
module.exports.Choice = Choice;
module.exports.Const = Const;
module.exports.Field = Field;
module.exports.Form = Form;
module.exports.Job = Job;
module.exports.StorageService = StorageService;
module.exports.TagDefinition = TagDefinition;
module.exports.Util = Util;
module.exports.ValidationResult = ValidationResult;
module.exports.ViewCache = ViewCache;
