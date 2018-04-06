const electron = require('electron');
var remote = require('electron').remote;
const app = remote.app;
const path = require('path');
const { AppSetting  } = require('./core/app_setting');
const BagIt = require('./bagit/bagit');
const { BagItProfile } = require('./core/bagit_profile');
const { BagItProfileInfo } = require('./core/bagit_profile_info');
const BuiltInProfiles = require('./core/builtin_profiles');
const BuiltInServices = require('./core/builtin_services');
const { Choice } = require('./core/choice');
const Const = require('./core/constants');
const { Field } = require('./core/field');
const { Form } = require('./core/form');
const { Job } = require('./core/job');
const log = require('./core/log');
const Migrations = require('./migrations/migrations');
const Plugins = require('./plugins/plugins');
const { StorageService } = require('./core/storage_service');
const { TagDefinition } = require('./core/tag_definition');
const State = require('./core/state');
const Templates = require('./core/templates');
const UI = require('./ui/ui');
const { Util } = require('./core/util');
const { ValidationResult } = require('./core/validation_result');

// Log unhandled errors.
function unhandledErr(err) {
    console.log(err);
    alert(err);
    log.error(err);
}
process.on('uncaughtException', unhandledErr);
process.on('unhandledRejection', unhandledErr);


module.exports.AppSetting = AppSetting;
module.exports.BagIt = BagIt;
module.exports.BagItProfile = BagItProfile;
module.exports.BagItProfileInfo = BagItProfileInfo;
module.exports.BuiltInProfiles = BuiltInProfiles;
module.exports.BuiltInServices = BuiltInServices;
module.exports.Choice = Choice;
module.exports.Const = Const;
module.exports.Field = Field;
module.exports.Form = Form;
module.exports.Job = Job;
module.exports.log = log;
module.exports.Migrations = Migrations;
module.exports.Plugins = Plugins;
module.exports.StorageService = StorageService;
module.exports.TagDefinition = TagDefinition;
module.exports.State = State;
module.exports.Templates = Templates;
module.exports.UI = UI;
module.exports.Util = Util;
module.exports.ValidationResult = ValidationResult;
