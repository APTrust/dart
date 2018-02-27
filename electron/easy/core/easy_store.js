const electron = require('electron');
var remote = require('electron').remote;
const app = remote.app;
const path = require('path');
const builtins = require('./builtin_profiles');
const AppSetting = require('./app_setting');
const BagItProfile = require('./bagit_profile');
const BagItProfileInfo = require('./bagit_profile_info');
const Choice = require('./choice');
const Const = require('./constants');
const Field = require('./field');
const Form = require('./form');
const Job = require('./job');
const Plugins = require('../plugins/plugins');
const StorageService = require('./storage_service');
const TagDefinition = require('./tag_definition');
const Util = require('./util');
const ValidationResult = require('./validation_result');

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
module.exports.Plugins = Plugins;
module.exports.StorageService = StorageService;
module.exports.TagDefinition = TagDefinition;
module.exports.Util = Util;
module.exports.ValidationResult = ValidationResult;
module.exports.ViewCache = ViewCache;
