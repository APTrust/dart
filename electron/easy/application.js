$(function() {
    const fs = require('fs');
    const path = require("path");
    const os = require('os');
    const es = require('./easy/easy_store');


    // Top nav menu
    $("#menuDashboard").on('click', function() { es.UI.Menu.dashboardShow(null); });
    $("#menuSetupShow").on('click', function() { es.UI.Menu.setupShow(null); });
    $("#menuAppSettingList").on('click', function() { es.UI.Menu.appSettingShowList(null); });
    $("#menuBagItProfileList").click(function() { es.UI.Menu.bagItProfileShowList(null); });
    $("#menuStorageServiceList").click(function() { storageServiceShowList(null); });
    $("#menuJobList").click(function() { es.UI.Menu.jobList(null); });
    $("#menuJobNew").click(es.UI.JobList.onNewClick);
    $("#menuHelpDoc").on('click', function() { es.UI.Menu.helpShow(); });
    $("#menuLog").on('click', function() { es.UI.Menu.logShow(); });

    // StorageService Form
    $(document).on("click", "#btnNewStorageService", function() { storageServiceShowForm(null); });
    $(document).on("click", "#btnStorageServiceSave", storageServiceSave);
    $(document).on("click", "#btnStorageServiceDelete", storageServiceDelete);

    // TagDefinition Form
    // $(document).on("click", "[data-btn-type=NewTagDefForProfile]", function() {
    //     tagDefinitionShowForm(null, $(this).data('tag-file'));
    // });
    // $(document).on("click", "#btnTagDefinitionSave", tagDefinitionSave);
    // $(document).on("click", "#btnTagDefinitionDelete", tagDefinitionDelete);
    // $(document).on("click", "#btnNewTagFile", function() { newTagFileShowForm(null); });
    // $(document).on("click", "#btnNewTagFileCreate", newTagFileCreate);

    // Jobs
    // $(document).on("click", "#btnNewJob", es.UI.Menu.jobNew);

    // Stop the default behavior of loading whatever file the user drags in.
    // easy/ui/job_files.js overrides this for drag-and-drop files.
    document.ondrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    };

    document.ondragover = () => {
        return false;
    };

    document.ondragleave = () => {
        return false;
    };

    document.ondragend = () => {
        return false;
    };

    // Clickable table rows for editing objects
    $(document).on("click", ".clickable-row", function() {
        var id = $(this).data("object-id");
        var type = $(this).data("object-type");
        switch (type) {
         // case 'AppSetting':
         //    es.UI.AppSettingList.showForm(id);
         //    break;
         // case 'BagItProfile':
         //    es.UI.Menu.bagItProfileShowForm(id);
         //    break;
         // case 'Job':
         //    es.UI.Menu.jobShow(id);
         //    break;
         case 'Ignore':
            break;
         case 'StorageService':
            storageServiceShowForm(id);
            break;
         // case 'TagDefinition':
         //    tagDefinitionShowForm(id, null);
         //    break;
         default:
            console.log(`Clickable row unknown type: ${type}?`);
        }
    });

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


    // Migrate config settings and data from EasyStore to DART.
    // We should be able to remove this after a few weeks.
    function migrateEasyStoreFiles() {
        var migrationDate = es.Util.getInternalVar('EasyStore Migration Date');
        if (migrationDate) {
            es.log.info(`Data was migrated ${migrationDate}`);
            return;
        } else {
            es.log.info('Migrating EasyStore data to DART');
        }
        var app = require('electron').remote.app;
        var easyStoreDir = path.join(app.getPath('appData'), 'EasyStore');
        var dartDir = path.join(app.getPath('appData'), 'DART');
        var files = ['app-settings.json', 'bagit-profiles.json', 'internal.json',
                     'jobs.json', 'storage-services.json'];
        if (fs.existsSync(easyStoreDir)) {
            for (var f of files) {
                var sourceFile = path.join(easyStoreDir, f);
                var destFile = path.join(dartDir, f);
                es.log.info(`Migrating ${sourceFile} -> ${destFile}`);
                copyFileSync(sourceFile, destFile);
            }
            var dartManifestDir = path.join(dartDir, 'manifests');
            var easyStoreManifestDir = path.join(easyStoreDir, 'manifests');
            var manifests = fs.readdirSync(easyStoreManifestDir);
            if (!fs.existsSync(dartManifestDir)) {
                fs.mkdirSync(dartManifestDir, 0o755);
            }
            for (var m of manifests) {
                var sourceFile = path.join(easyStoreManifestDir, m);
                var destFile = path.join(dartManifestDir, m);
                es.log.info(`Migrating ${sourceFile} -> ${destFile}`);
                copyFileSync(sourceFile, destFile);
            }
            es.Util.setInternalVar('EasyStore Migration Date', new Date().toJSON());
        }
    }

    // This function exists in Node.js from version 1.8.5 on, but Electron
    // uses an older version of Node, so we have to write our own.
    // This is used only by migrateEasyStoreFiles, and can be deleted when
    // that is removed. The files we're copying should all be under 500k,
    // so we can copy them in a single chunk.
    function copyFileSync(src, dest) {
        fs.writeFileSync(dest, fs.readFileSync(src));
    }


    // Initialize core APTrust settings.
    var aptProvider = es.Plugins.getSetupProviderByName('APTrust');
    var aptSetup = new aptProvider.Provider();
    aptSetup.installAppSettings();
    aptSetup.installBagItProfiles();
    aptSetup.installStorageServices();

    // Delete this legacy setting
    var pathToBagger = es.AppSetting.findByName("Path to Bagger")
    if (pathToBagger) {
        pathToBagger.delete();
    }

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
    es.UI.Menu.dashboardShow();
    es.log.info("DART started");
    migrateEasyStoreFiles();

    // This is for interactive testing in the console.
    window.es = es;
});
