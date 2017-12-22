const electron = require('electron');
var remote = require('electron').remote;
const app = remote.app;
const path = require('path');
const builtins = require(path.resolve('electron/easy/core/builtin_profiles'));
const AppSetting = require(path.resolve('electron/easy/core/app_setting'));
const BagItProfile = require(path.resolve('electron/easy/core/bagit_profile'));
const BagItProfileInfo = require(path.resolve('electron/easy/core/bagit_profile_info'));
const Choice = require(path.resolve('electron/easy/core/choice'));
const Const = require(path.resolve('electron/easy/core/constants'));
const Field = require(path.resolve('electron/easy/core/field'));
const Form = require(path.resolve('electron/easy/core/form'));
const Job = require(path.resolve('electron/easy/core/job'));
const StorageService = require(path.resolve('electron/easy/core/storage_service'));
const TagDefinition = require(path.resolve('electron/easy/core/tag_definition'));
const Util = require(path.resolve('electron/easy/core/util'));
const ValidationResult = require(path.resolve('electron/easy/core/validation_result'));

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
