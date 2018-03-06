$(function() {
    const path = require("path");
    const os = require('os');
    const es = require('./easy/easy_store');


    // Top nav menu
    $("#menuDashboard").on('click', function() { dashboardShow(null); });
    $("#menuSetupShow").on('click', function() { es.UI.Menu.setupShow(null); });
    $("#menuAppSettingList").on('click', function() { appSettingShowList(null); });
    $("#menuBagItProfileList").click(function() { bagItProfileShowList(null); });
    $("#menuStorageServiceList").click(function() { storageServiceShowList(null); });
    $("#menuJobList").click(function() { jobList(null); });
    $("#menuJobNew").click(es.UI.Menu.jobNew);
    $("#menuHelp").on('click', function() { helpShow(null); });

    // AppSetting Form
    $(document).on("click", "#btnNewAppSetting", function() { appSettingShowForm(null); });
    $(document).on("click", "#btnApplicationSettingSave", appSettingSave);
    $(document).on("click", "#btnApplicationSettingDelete", appSettingDelete);

    // BagItProfile Form
    $(document).on("click", "#btnNewBagItProfile", function() { bagItProfileChooseNew(); });
    $(document).on("click", "#btnBagItProfileSave", bagItProfileSave);
    $(document).on("click", "#btnBagItProfileDelete", bagItProfileDelete);
    $(document).on("click", "#btnNewBagItProfileCreate", bagItProfilePrepare);

    // StorageService Form
    $(document).on("click", "#btnNewStorageService", function() { storageServiceShowForm(null); });
    $(document).on("click", "#btnStorageServiceSave", storageServiceSave);
    $(document).on("click", "#btnStorageServiceDelete", storageServiceDelete);

    // TagDefinition Form
    $(document).on("click", "[data-btn-type=NewTagDefForProfile]", function() {
        tagDefinitionShowForm(null, $(this).data('tag-file'));
    });
    $(document).on("click", "#btnTagDefinitionSave", tagDefinitionSave);
    $(document).on("click", "#btnTagDefinitionDelete", tagDefinitionDelete);
    $(document).on("click", "#btnNewTagFile", function() { newTagFileShowForm(null); });
    $(document).on("click", "#btnNewTagFileCreate", newTagFileCreate);

    // Jobs
    $(document).on("click", "#btnNewJob", es.UI.Menu.jobNew);

    document.ondragover = () => {
        return false;
    };

    document.ondragleave = () => {
        return false;
    };

    document.ondragend = () => {
        return false;
    };

    document.ondrop = (e) => {
        var job = es.State.ActiveObject;
        e.preventDefault();
        e.stopPropagation();
        if (document.getElementById('filesPanel') == null) {
            return;
        }
        for (let f of e.dataTransfer.files) {
            job.addFile(f.path);
        }
        return false;
    };

     $(document).on('click', '.deleteCell', function(){
        var job = es.State.ActiveObject;
        job.deleteFile(this);
     });


    // Clickable table rows for editing objects
    $(document).on("click", ".clickable-row", function() {
        var id = $(this).data("object-id");
        var type = $(this).data("object-type");
        switch (type) {
         case 'AppSetting':
            appSettingShowForm(id);
            break;
         case 'BagItProfile':
            bagItProfileShowForm(id);
            break;
         case 'Job':
            es.UI.Menu.jobShow(id);
            break;
         case 'Ignore':
            break;
         case 'StorageService':
            storageServiceShowForm(id);
            break;
         case 'TagDefinition':
            tagDefinitionShowForm(id, null);
            break;
         default:
            console.log(`Clickable row unknown type: ${type}?`);
        }
    });

    // Dashboard
    function dashboardShow(message) {
        var data = {};
        data.jobs = es.Job.list(10, 0);
        var setupsCompleted = es.Util.getInternalVar('Setups Completed');
        if (setupsCompleted && setupsCompleted.length) {
            data.setupsCompleted = `You have already completed the setup process for: <b>${setupsCompleted.join(', ')}</b>`;
        }
        $("#container").html(es.Templates.dashboard(data));
        es.State.ActiveObject = null;
    }

    // Help doc
    function helpShow(message) {
        $("#container").html(es.Templates.help());
        es.State.ActiveObject = null;
    }

    // TODO: Refactor into a UI manager class, because this needs to
    // accessible from the outside.
    window.dashboardShow = dashboardShow;


    // App Setting functions
    function appSettingShowList(message, limit = 50, offset = 0) {
        var data = {};
        data.items = es.AppSetting.list(limit, offset);
        data.success = message;
        data.previousLink = es.AppSetting.previousLink(limit, offset)
        data.nextLink = es.AppSetting.nextLink(limit, offset)
        $("#container").html(es.Templates.appSettingList(data));
        es.State.ActiveObject = data.items;
    }

    // TODO: Refactor into a UI manager class, because this needs to
    // accessible from the outside.
    window.appSettingShowList = appSettingShowList;


    function appSettingShowForm(id) {
        var setting = new es.AppSetting();
        var showDeleteButton = false;
        if (!es.Util.isEmpty(id)) {
            setting = es.AppSetting.find(id);
            if (setting.userCanDelete) {
                showDeleteButton = true;
            }
        }
        var data = {};
        data['form'] = setting.toForm();
        data['showDeleteButton'] = showDeleteButton;
        $("#container").html(es.Templates.appSettingForm(data));
        es.State.ActiveObject = setting;
    }

    function appSettingSave() {
        var setting = es.AppSetting.fromForm();
        var result = setting.validate();
        if (result.isValid()) {
            setting.save();
            return appSettingShowList(`Setting ${setting.name} has been saved`);
        } else {
            var form = setting.toForm();
            form.setErrors(result.errors);
            var data = {};
            data['form'] = form;
            data['showDeleteButton'] = es.AppSetting.find(setting.id) != null && setting.userCanDelete;
            $("#container").html(es.Templates.appSettingForm(data));
        }
        es.State.ActiveObject = setting;
    }

    function appSettingDelete() {
        if (!confirm("Delete this setting?")) {
            return;
        }
        var setting = es.State.ActiveObject.delete();
        appSettingShowList(`Deleted setting ${setting.name}`);
    }

    // BagItProfile functions
    function bagItProfileShowList(message, limit = 50, offset = 0) {
        var data = {};
        data.items = es.BagItProfile.list(limit, offset);
        data.success = message;
        data.previousLink = es.BagItProfile.previousLink(limit, offset)
        data.nextLink = es.BagItProfile.nextLink(limit, offset)
        $("#container").html(es.Templates.bagItProfileList(data));
        es.State.ActiveObject = data.items;
    }

    // TODO: Refactor into a UI manager class, because this needs to
    // accessible from the outside.
    window.bagItProfileShowList = bagItProfileShowList;


    function bagItProfileChooseNew() {
        var form = new es.Form();
        form.fields['baseProfile'] = new es.Field("baseProfile", "baseProfile", "New Profile", "");
        form.fields['baseProfile'].choices = [
            new es.Choice("", "Blank", true),
        ];
        form.fields['baseProfile'].help = "Do you want to create a blank new profile from scratch, or a new profile that conforms to an existing standard?";
        var sortedKeys = Object.keys(es.BuiltInProfiles.ProfilesAvailable).sort();
        for(var name of sortedKeys) {
            var profileId = es.BuiltInProfiles.ProfilesAvailable[name];
            form.fields['baseProfile'].choices.push(new es.Choice(profileId, name, false));
        }
        var data = {};
        data.form = form;
        $('#modalTitle').text("Create New BagIt Profile");
        $("#modalContent").html(es.Templates.bagItProfileNew(data));
        $('#modal').modal();
    }

    function bagItProfilePrepare() {
        var profileId = null;
        var builtinId = $('#baseProfile').val().trim();
        if (!es.Util.isEmpty(builtinId)) {
            var profile = es.BagItProfile.createProfileFromBuiltIn(builtinId, true);
            profileId = profile.id;
        }
        $('#modal').modal('hide');
        return bagItProfileShowForm(profileId);
    }

    function bagItProfileShowForm(id) {
        var profile = new es.BagItProfile();
        var showDeleteButton = false;
        if (!es.Util.isEmpty(id)) {
            profile = es.BagItProfile.find(id);
            showDeleteButton = !profile.isBuiltIn;
        }
        var data = {};
        data['form'] = profile.toForm();
        data['tags'] = profile.tagsGroupedByFile();
        data['showDeleteButton'] = showDeleteButton;
        $("#container").html(es.Templates.bagItProfileForm(data));
        es.State.ActiveObject = profile;
    }

    function bagItProfileSave() {
        var profile = es.BagItProfile.fromForm();
        var result = profile.validate();
        if (result.isValid()) {
            profile.save();
            return bagItProfileShowList(`Profile ${profile.name} saved.`);
        }
        var data = {};
        data['form'] = profile.toForm();
        data['form'].setErrors(result.errors);
        data['tags'] = profile.tagsGroupedByFile();
        $("#container").html(es.Templates.bagItProfileForm(data));
        es.State.ActiveObject = profile;
    }

    function bagItProfileDelete() {
        if (!confirm("Delete this profile?")) {
            return;
        }
        var profile = es.State.ActiveObject.delete();
        bagItProfileShowList(`Deleted profile ${profile.name}`);
    }

    // StorageService functions
    function storageServiceShowList(message, limit = 50, offset = 0) {
        var data = {};
        data.items = es.StorageService.list(limit, offset);
        data.success = message;
        data.previousLink = es.StorageService.previousLink(limit, offset)
        data.nextLink = es.StorageService.nextLink(limit, offset)
        $("#container").html(es.Templates.storageServiceList(data));
        es.State.ActiveObject = data.items;
    }

    // TODO: Refactor into a UI manager class, because this needs to
    // accessible from the outside.
    window.storageServiceShowList = storageServiceShowList;

    function storageServiceShowForm(id) {
        var service = new es.StorageService();
        var showDeleteButton = false;
        if (!es.Util.isEmpty(id)) {
            service = es.StorageService.find(id);
            showDeleteButton = true;
        }
        var data = {};
        data['form'] = service.toForm();
        data['showDeleteButton'] = showDeleteButton;
        $("#container").html(es.Templates.storageServiceForm(data));
        es.State.ActiveObject = service;
    }

    function storageServiceSave() {
        var service = es.StorageService.fromForm();
        var result = service.validate();
        if (result.isValid()) {
            service.save();
            return storageServiceShowList(`Storage service ${service.name} has been saved`);
        } else {
            var form = service.toForm();
            form.setErrors(result.errors);
            var data = {};
            data['form'] = form;
            data['showDeleteButton'] = es.StorageService.find(service.id) != null;
            $("#container").html(es.Templates.storageServiceForm(data));
        }
        es.State.ActiveObject = service;
    }

    function storageServiceDelete() {
        if (!confirm("Delete this storage service?")) {
            return;
        }
        var service = es.State.ActiveObject.delete();
        storageServiceShowList(`Deleted storage service ${service.name}`);
    }


    // Tag Definition functions
    function tagDefinitionShowForm(id, tagFile) {
        var tag = es.State.ActiveObject.findTagById(id);
        var showDeleteButton = (tag != null && !tag.isBuiltIn);
        if (tag == null) {
            tag = new es.TagDefinition(tagFile, 'New-Tag');
            showDeleteButton = false;
        }
        var data = {};
        data['form'] = tag.toForm();
        data['showDeleteButton'] = showDeleteButton;
        data['tagContext'] = "profile";
        $('#modalTitle').text(tag.tagName);
        $("#modalContent").html(es.Templates.tagDefinitionForm(data));
        $('#modal').modal();
    }

    function tagDefinitionSave() {
        // Copy for values to existing tag, whic is part of the
        // BagItProfile currently stored in es.State.ActiveObject.
        var tagFromForm = es.TagDefinition.fromForm();
        var result = tagFromForm.validate();
        if (result.isValid()) {
            es.State.ActiveObject = Object.assign(es.State.ActiveObject, es.BagItProfile.fromForm());
            var existingTag = es.State.ActiveObject.findTagById(tagFromForm.id);
            if (existingTag == null) {
                // This is a new tag, so add it to the profile's
                // list of required tags.
                existingTag = new es.TagDefinition('', '');
                es.State.ActiveObject.requiredTags.push(existingTag);
            }
            Object.assign(existingTag, tagFromForm);
            es.State.ActiveObject.save();
            $('#modal').modal('hide');
            bagItProfileShowForm(es.State.ActiveObject.id);
        } else {
            var form = tagFromForm.toForm();
            form.setErrors(result.errors);
            var data = {};
            data['form'] = form;
            data['tagContext'] = "profile";
            $("#modalContent").html(es.Templates.tagDefinitionForm(data));
        }
    }

    function tagDefinitionDelete() {
        if (!confirm("Delete this tag?")) {
            return;
        }
        var tagId = es.TagDefinition.fromForm().id;
        es.State.ActiveObject.requiredTags = es.State.ActiveObject.requiredTags.filter(item => item.id != tagId);
        es.State.ActiveObject.save();
        $('#modal').modal('hide');
        bagItProfileShowForm(es.State.ActiveObject.id);
    }

    function newTagFileShowForm(err) {
        var form = new es.Form();
        form.fields['newTagFileName'] = new es.Field("newTagFileName", "newTagFileName", "New Tag File Name", "");
        if (err != null) {
            var errs = {};
            errs['newTagFileName'] = err;
            form.setErrors(errs);
        }
        var data = {};
        data['form'] = form;
        data['tagContext'] = "profile";
        $('#modalTitle').text("New Tag File");
        $("#modalContent").html(es.Templates.newTagFileForm(data));
        $('#modal').modal();
    }

    function newTagFileCreate() {
        var tagFileName = $('#newTagFileName').val().trim();
        var re = /^[A-Za-z0-9_\-\.]+\.txt$/;
        if (!tagFileName.match(re)) {
            err = "Tag file name must contain at least one character and end with .txt";
            return newTagFileShowForm(err);
        }
        tagDefinitionShowForm(null, tagFileName);
    }


    // Job Functions
    function jobList(message, limit = 50, offset = 0) {
        var data = {};
        data.items = es.Job.list(limit, offset);
        data.previousLink = es.Job.previousLink(limit, offset);
        data.nextLink = es.Job.nextLink(limit, offset);
        data.success = message;
        $("#container").html(es.Templates.jobList(data));
        es.State.ActiveObject = data.items;
    }

    // Initialize core APTrust settings.
    var aptProvider = es.Plugins.getSetupProviderByName('APTrust');
    var aptSetup = new aptProvider.Provider();
    aptSetup.installAppSettings();
    aptSetup.installBagItProfiles();
    aptSetup.installStorageServices();

    $('.modal-content').resizable({
        //alsoResize: ".modal-dialog",
        minHeight: 300,
        minWidth: 300
    });
    $('.modal-dialog').draggable();

    $('#myModal').on('show.bs.modal', function() {
        $(this).find('.modal-body').css({
            'max-height': '100%'
        });
    });

    // Show the dashboard on startup.
    dashboardShow();

    // This is for interactive testing in the console.
    window.es = es;
});
