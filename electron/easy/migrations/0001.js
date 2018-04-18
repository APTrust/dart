const { AppSetting } = require('../core/app_setting');
const fs = require('fs');
const path = require('path');
const log = require('../core/log');
const Plugins = require('../plugins/plugins');
const { Util } = require('../core/util');

// This is the only function we need to export. It will be called
// every time the application starts. This function records the
// fact that it has been run in an internal variable. It should
// always check that variable so that it does not run again.
function run() {
    var migrationName = 'Migration_' + path.parse(__filename).name;
    var runDate = Util.getInternalVar(migrationName);
    if (runDate) {
        log.info(`Skipping migration ${migrationName}: was run on ${runDate}`);
        return;
    }
    log.info(`Running migration ${migrationName}`);
    initCoreAPTrustSettings();
    fixUserCanDelete();
    deleteLegacySettings();
    migrateEasyStoreFiles();
    var now = new Date().toISOString();
    log.info(`Finished ${migrationName} at ${now}`);
    Util.setInternalVar(migrationName, now);
}

function initCoreAPTrustSettings() {
    var aptProvider = Plugins.getSetupProviderByName('APTrust');
    var aptSetup = new aptProvider.Provider();
    aptSetup.installAppSettings();
    aptSetup.installBagItProfiles();
    aptSetup.installStorageServices();
}

// Fix userCanDelete. This property was lost after editing
// an AppSetting.
function fixUserCanDelete() {
    var cantDelete = ['Bagging Directory', 'Institution Domain'];
    for (var settingName of cantDelete) {
        var setting = AppSetting.findByName(settingName);
        if (setting) {
            setting.userCanDelete = false;
            setting.save();
        }
    }
}

function deleteLegacySettings() {
    var pathToBagger = AppSetting.findByName("Path to Bagger")
    if (pathToBagger) {
        pathToBagger.delete();
    }
}

// Migrate config settings and data from EasyStore to DART.
// We should be able to remove this after a few weeks.
function migrateEasyStoreFiles() {
    var migrationDate = Util.getInternalVar('EasyStore Migration Date');
    if (migrationDate) {
        log.info(`Data was migrated ${migrationDate}`);
        return;
    } else {
        log.info('Migrating EasyStore data to DART');
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
            log.info(`Migrating ${sourceFile} -> ${destFile}`);
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
            log.info(`Migrating ${sourceFile} -> ${destFile}`);
            copyFileSync(sourceFile, destFile);
        }
        Util.setInternalVar('EasyStore Migration Date', new Date().toJSON());
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


module.exports.run = run;
