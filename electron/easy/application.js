$(function() {
    const fs = require('fs');
    const path = require("path");
    const os = require('os');
    const es = require('./easy/easy_store');


    // ------------------------------------------------------
    // Begin code that should go into release update module.
    // ------------------------------------------------------


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
                if (!fs.existsSync(sourceFile)) {
                    continue;
                }
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
                if (!fs.existsSync(sourceFile)) {
                    continue;
                }
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

    // Fix userCanDelete. This property was lost after editing
    // an AppSetting.
    var cantDelete = ['Bagging Directory', 'Institution Domain'];
    for (var settingName of cantDelete) {
        var setting = es.AppSetting.findByName(settingName);
        if (setting) {
            setting.userCanDelete = false;
            setting.save();
        }
    }

    // Delete this legacy setting
    var pathToBagger = es.AppSetting.findByName("Path to Bagger")
    if (pathToBagger) {
        pathToBagger.delete();
    }


    // ------------------------------------------------------
    // End of code that should go into release update module.
    // ------------------------------------------------------


    // Wire up the main menu events
    es.UI.Menu.initEvents();

    // Show the dashboard on startup.
    es.UI.Menu.dashboardShow();
    es.log.info("DART started");
    migrateEasyStoreFiles();

    // This is for interactive testing in the console.
    window.es = es;
});
