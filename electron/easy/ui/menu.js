const { AppSetting  } = require('../core/app_setting');
const { BagItProfile } = require('../core/bagit_profile');
const { BagItProfileInfo } = require('../core/bagit_profile_info');
const BuiltInProfiles = require('../core/builtin_profiles');
const BuiltInServices = require('../core/builtin_services');
const { Choice } = require('../core/choice');
const Const = require('../core/constants');
const { Field } = require('../core/field');
const { Form } = require('../core/form');
const { Job } = require('../core/job');
const Plugins = require('../plugins/plugins');
const { StorageService } = require('../core/storage_service');
const { TagDefinition } = require('../core/tag_definition');
const State = require('../core/state');
const Templates = require('../core/templates');
const { Util } = require('../core/util');
const { ValidationResult } = require('../core/validation_result');

class Menu {

    static appSettingShowList(message, limit = 50, offset = 0) {
        var data = {};
        data.items = AppSetting.list(limit, offset);
        data.success = message;
        data.previousLink = AppSetting.previousLink(limit, offset)
        data.nextLink = AppSetting.nextLink(limit, offset)
        State.ActiveObject = data.items;
        $("#container").html(Templates.appSettingList(data));
    }

    static bagItProfileShowForm(id) {
        var profile = new BagItProfile();
        var showDeleteButton = false;
        if (!Util.isEmpty(id)) {
            profile = BagItProfile.find(id);
            showDeleteButton = !profile.isBuiltIn;
        }
        State.ActiveObject = profile;
        var data = {};
        data['form'] = profile.toForm();
        data['tags'] = profile.tagsGroupedByFile();
        data['showDeleteButton'] = showDeleteButton;
        $("#container").html(Templates.bagItProfileForm(data));
    }

    static bagItProfileShowList(message, limit = 50, offset = 0) {
        var data = {};
        data.items = BagItProfile.list(limit, offset);
        data.success = message;
        data.previousLink = BagItProfile.previousLink(limit, offset)
        data.nextLink = BagItProfile.nextLink(limit, offset)
        $("#container").html(Templates.bagItProfileList(data));
        State.ActiveObject = data.items;
    }

    static dashboardShow() {
        var data = {};
        data.jobs = Job.list(10, 0);
        var setupsCompleted = Util.getInternalVar('Setups Completed');
        if (setupsCompleted && setupsCompleted.length) {
            data.setupsCompleted = `You have already completed the setup process for: <b>${setupsCompleted.join(', ')}</b>`;
        }
        $("#container").html(Templates.dashboard(data));
        State.ActiveObject = null;
    }

    static helpShow() {
        $("#container").html(Templates.help());
        State.ActiveObject = null;
    }

    static jobList(message, limit = 50, offset = 0) {
        var data = {};
        data.items = Job.list(limit, offset);
        data.previousLink = Job.previousLink(limit, offset);
        data.nextLink = Job.nextLink(limit, offset);
        data.success = message;
        $("#container").html(Templates.jobList(data));
        State.ActiveObject = data.items;
    }

    static jobNew() {
        var job = new Job();
        job.clearFiles();
        job.resetFileOptions();
        State.ActiveObject = job;
        $("#container").html(Templates.jobFiles());
    };

    static jobShow(id) {
        var job = Job.find(id);
        State.ActiveObject = job;
        $("#container").html(Templates.jobFiles());
    }

    static logShow() {
        $("#container").html(Templates.log());
        State.ActiveObject = null;
    }

    static setupShow() {
        var data = {};
        var setupsCompleted = Util.getInternalVar("Setups Completed");
        if (setupsCompleted && setupsCompleted.length) {
            data.setupsCompleted = `You have already completed the following setups: <b>${setupsCompleted.join(', ')}</b>`;
        }
        var setupList = new Field('setupProvider', 'setupProvider', 'Repository', '');
        setupList.choices = Choice.makeList(Plugins.listSetupProviders(), '', true);
        data.setupList = setupList;
        $("#container").html(Templates.setup(data));
        State.ActiveObject = null;
    }

}

module.exports.Menu = Menu;
