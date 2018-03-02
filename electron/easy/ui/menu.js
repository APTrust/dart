const { AppSetting  } = require('../core/app_setting');
const { BagItProfile } = require('../core/bagit_profile');
const { BagItProfileInfo } = require('../core/bagit_profile_info');
const { BuiltInProfiles } = require('../core/builtin_profiles');
const { BuiltInServices } = require('../core/builtin_services');
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
        job.setFileListUI();
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
