// Field is a form field.
const os = require('os');
const path = require('path');
const process = require('process');
const { AppSetting } = require('../../core/app_setting');
const { BagItProfile } = require('../../core/bagit_profile');
const builtinProfiles = require('../../core/builtin_profiles');
const builtinServices = require('../../core/builtin_services');
const { Field } = require('../../core/field');
const { StorageService } = require('../../core/storage_service');

// Stuff we have to set for the plugin loader to be able to
// discover and describe our plugin.
const name = "Basic";
const description = "Provides basic setup questions for an installation with no backing repository.";
const version = "0.1";

// Help messages for our setup questions.
const BaggingDirHelp = "Where should the bagger assemble bags? This should be a directory name. Examples: 'c:\Users\josie\Documents\MyBags', '/User/josie/temp'.";

// Regex patterns for validation.
const domainNamePattern = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
const macLinuxFilePattern = /(\/\w+)+/;  // This is a little simplistic. Looking for an absolute path.
const windowsFilePattern = /^(?:[a-z]:|\\\\[a-z0-9_.$-]+\\[a-z0-9_.$-]+)\\(?:[^\\\/:*?"<>|\r\n]+\\)*[^\\\/:*?"<>|\r\n]*$/i;


class Basic {

    // Constructor is required for this type of plugin.
    constructor() {
        this.fields = [];
        this._initFields();
    }

    // describe returns descriptive info about the plugin, so it
    // can be discovered by the app.
    describe() {
        return { name: name,
                 description: description,
                 version: version,
               };
    }

    // The setup manager will call this. This should a string of text or
    // html to display to the user
    startMessage() {
        return `The setup process will install required base settings, and will ask you to answer a series of ${this.fields.length} questions. Click <b>Next</b> to continue.`;
    }

    endMessage() {
        return `<p>Setup is complete. See the <b>Help</b> link in the menu above for information on how to add or change the settings, or select <b>Job &gt; New</b> from the menu above to create a new job.</p>`;
    }

    // Add the minimum required app settings.
    installAppSettings() {
        var installed = [];
        if (AppSetting.findByName("Bagging Directory") == null) {
            var dir = path.join(os.homedir(), "tmp", "dart");
            var setting = new AppSetting("Bagging Directory", dir);
            setting.userCanDelete = false;
            setting.help = "Where should DART create bags?";
            setting.save();
            installed.push("Bagging Directory");
        }
        if (AppSetting.findByName("Path to Bagger") == null) {
            var appName = os.platform == 'win32' ? "apt_create_bag.exe" : "apt_create_bag";
            var appPath = path.join(os.homedir(), appName);
            var setting = new AppSetting("Path to Bagger", appPath);
            setting.userCanDelete = false;
            setting.help = "What is the full path to the apt_create_bag executable?";
            setting.save();
            installed.push("Path to Bagger");
        }
        var message = "The minimum required application variables are already installed.";
        if (installed.length > 0) {
            message = "Installed minimum required application variables: " + installed.join(', ');
        }
        return message;
    }

    // Add required BagIt profiles
    installBagItProfiles() {
        var installed = [];
        if (!BagItProfile.find(builtinProfiles.APTrustProfileId)) {
            BagItProfile.createProfileFromBuiltIn(builtinProfiles.APTrustProfileId);
            installed.push("APTrust BagIt Profile");
        }
        if (!BagItProfile.find(builtinProfiles.DPNProfileId)) {
            BagItProfile.createProfileFromBuiltIn(builtinProfiles.DPNProfileId);
            installed.push("DPN BagIt Profile");
        }
        var message = "Sample BagIt profiles are already installed.";
        if (installed.length > 0) {
            message = "Installed sample BagIt profiles: " + installed.join(', ');
        }
        return message;
    }

    // Install storage services
    installStorageServices() {
        // Nothing to do here...
        return '';
    }

    // _initFields sets up the questions the user will have to answer.
    // Questions will be presented in the order they are added.
    _initFields() {
        this.fields.push(this._getBaggingDirField());
    }

    _getBaggingDirField() {
        var baggingDir = this._getSetupField('baggingDir', 'Bagging Directory');
        var setting = AppSetting.findByName("Bagging Directory");
        if (setting) {
            baggingDir.value = setting.value;
        }
        baggingDir.help = BaggingDirHelp;
        baggingDir.validator = function(value) {
            baggingDir.value = value;
            var pattern = macLinuxFilePattern;
            var errMsg = "Enter an absolute path that begins with a forward slash.";
            if (process.platform == 'win32') {
                pattern = windowsFilePattern;
                errMsg = "Enter an absolute path, like C:\Users\josie or \\server\share\folder";
            }
            if (value && value.match(pattern)) {
                // If value is OK, save it into AppSettings.
                if (setting) {
                    setting.value = value;
                    setting.save();
                }
                baggingDir.error = "";
                return true;
            }
            baggingDir.error = errMsg;
            return false;
        }
        return baggingDir;
    }

    // _getSetupField is a utility function that returns a Field object for a
    // question on your setup form.
    _getSetupField(name, label) {
        var field = new Field(name, name, label, '');
        field.attrs['required'] = true;
        return field;
    }

}

module.exports.Provider = Basic;
module.exports.name = name;
module.exports.description = description;
module.exports.version = version;
