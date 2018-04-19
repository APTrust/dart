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
const { JobList } = require('./job_list');
const Plugins = require('../plugins/plugins');
const { StorageService } = require('../core/storage_service');
const { TagDefinition } = require('../core/tag_definition');
const State = require('../core/state');
const Templates = require('../core/templates');
const { Util } = require('../core/util');
const { ValidationResult } = require('../core/validation_result');

class Menu {

    static initEvents() {
        // Top nav menu
        $("#menuDashboard").on('click', function() { Menu.dashboardShow(null); });
        $("#menuSetupShow").on('click', function() { Menu.setupShow(null); });
        $("#menuAppSettingList").on('click', function() { Menu.appSettingShowList(null); });
        $("#menuBagItProfileList").click(function() { Menu.bagItProfileShowList(null); });
        $("#menuStorageServiceList").click(function() { Menu.storageServiceShowList(null); });
        $("#menuJobList").click(function() { Menu.jobList(null); });
        $("#menuJobNew").click(JobList.onNewClick);
        $("#menuHelpDoc").on('click', function() { Menu.helpShow(); });
        $("#menuLog").on('click', function() { Menu.logShow(); });


        // Stop the default behavior of loading and displaying
        // whatever file the user drags in.
        // easy/ui/job_files.js overrides this for drag-and-drop files.
        document.ondrop = (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };
        document.ondragover = () => { return false; };
        document.ondragleave = () => { return false; };
        document.ondragend = () => { return false; };

        // Set up the modal dialog for pop-up forms
        $('.modal-content').resizable({
            minHeight: 300,
            minWidth: 300
        });
        $('.modal-dialog').draggable();
        $('#myModal').on('show.bs.modal', function() {
            $(this).find('.modal-body').css({
                'max-height': '100%'
            });
        });

    }

    static appSettingShowList(message, limit = 50, offset = 0) {
        var data = {};
        data.items = AppSetting.list(limit, offset);
        data.success = message;
        data.previousLink = AppSetting.previousLink(limit, offset)
        data.nextLink = AppSetting.nextLink(limit, offset)
        State.ActiveObject = data.items;
        $("#container").html(Templates.appSettingList(data));
    }

    static bagItProfileShowList(message, limit = 50, offset = 0) {
        var data = {};
        data.items = BagItProfile.list(limit, offset);
        data.success = message;
        data.previousLink = BagItProfile.previousLink(limit, offset)
        data.nextLink = BagItProfile.nextLink(limit, offset)
        State.ActiveObject = data.items;
        $("#container").html(Templates.bagItProfileList(data));
    }

    static dashboardShow() {
        var jobs = Job.list(20, 0);
        var data = {};
        data.jobs = jobs;
        var setupsCompleted = Util.getInternalVar('Setups Completed');
        if (setupsCompleted && setupsCompleted.length) {
            data.setupsCompleted = `You have already completed the setup process for: <b>${setupsCompleted.join(', ')}</b>`;
        }
        State.ActiveObject = jobs;
        $("#container").html(Templates.dashboard(data));
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

    static storageServiceShowList(message, limit = 50, offset = 0) {
        var data = {};
        data.items = es.StorageService.list(limit, offset);
        data.success = message;
        data.previousLink = es.StorageService.previousLink(limit, offset)
        data.nextLink = es.StorageService.nextLink(limit, offset)
        $("#container").html(es.Templates.storageServiceList(data));
        es.State.ActiveObject = data.items;
    }

}

module.exports.Menu = Menu;
