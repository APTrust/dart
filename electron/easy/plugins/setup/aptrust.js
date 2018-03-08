// Field is a form field.
const os = require('os');
const path = require('path');
const process = require('process');
const { AppSetting } = require('../../core/app_setting');
const { BagItProfile } = require('../../core/bagit_profile');
const builtinProfiles = require('../../core/builtin_profiles');
const builtinServices = require('../../core/builtin_services');
const { Choice } = require('../../core/choice');
const { Field } = require('../../core/field');

// Stuff we have to set for the plugin loader to be able to
// discover and describe our plugin.
const name = "APTrust";
const description = "Provides setup questions for APTrust";
const version = "0.1";

// Help messages for our setup questions.
const OrgNameHelp = "Enter the name of your organization. This name will be written into the Source-Organization field of the bag-info.txt file of each APTrust bag you create. Examples: 'University of Virginia', 'University of Virginia School of Law'.";
const DomainHelp = "Enter your institution's domain name. For example, 'unc.edu', 'virginia.edu'. If you are making deposits for only one part of a larger organization, enter your group's sub-domain. For example, 'med.virginia.edu', 'law.virginia.edu', etc.";
const BaggingDirHelp = "Where should the bagger assemble bags? This should be a directory name. Examples: 'c:\Users\josie\Documents\APTrustBags', '/User/josie/temp'.";
const AccessHelp = "Set the default access policy for your APTrust bags. Consortia means other APTrust depositors can see your bag's metadata (title and description), but not its contents. Insitution means all APTrust users from your institution can see this object's metadata. Restricted means only your institutional administrator can see that this bag exists. Institution is usually the safe default. You can override this setting for any individual bag.";
const AwsAccessKeyIdHelp = "Enter your AWS Access Key ID here, if you received one. This is the shorter of the two keys. If you did not receive an AWS access key, contact help@aptrust.org to get one.";
const AwsSecretKeyHelp = "Enter your AWS Secret Access Key here, if you received one. This is the longer of the two keys. If you did not receive an AWS access key, contact help@aptrust.org to get one.";

// Regex patterns for validation.
const domainNamePattern = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
const macLinuxFilePattern = /(\/\w+)+/;  // This is a little simplistic. Looking for an absolute path.
const windowsFilePattern = /^(?:[a-z]:|\\\\[a-z0-9_.$-]+\\[a-z0-9_.$-]+)\\(?:[^\\\/:*?"<>|\r\n]+\\)*[^\\\/:*?"<>|\r\n]*$/i;


class APTrust {

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
        return `The APTrust setup process will install required APTrust settings, and will ask you to answer a series of ${this.fields.length} questions. If you are an APTrust member and you have questions or run into problems, contact us at <a href='mailto:help@aptrust.org'>help@aptrust.org</a> for assistance. Click <b>Next</b> to continue.`;
    }

    endMessage() {
        return `<p>APTrust setup is complete. See the <b>Help</b> link in the menu above for information on how to add or change the settings, or select <b>Job &gt; New</b> from the menu above to create a new job.</p>`;
    }

    // Add app settings required by APTrust.
    installAppSettings() {
        var installed = [];
        if (AppSetting.findByName("Institution Domain") == null) {
            var setting = new AppSetting("Institution Domain", "example.org");
            setting.userCanDelete = false;
            setting.help = "Set this to the value of your organization's internet domain. This is a required setting. You cannot delete it. You can only change its value."
            setting.save();
            installed.push("Institution Domain");
        }
        if (AppSetting.findByName("Bagging Directory") == null) {
            var dir = path.join(os.homedir(), "tmp", "easy-store");
            var setting = new AppSetting("Bagging Directory", dir);
            setting.userCanDelete = false;
            setting.help = "Where should Easy Store create bags?";
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
        if (AppSetting.findByName("Pharos Demo API Login") == null) {
            var setting = new AppSetting("Pharos Demo API Login", '');
            setting.userCanDelete = false;
            setting.help = "What email address do you use to log in to Pharos on APTrust's demo system?";
            setting.save();
            installed.push("Pharos Demo API Login");
        }
        if (AppSetting.findByName("Pharos Demo API Key") == null) {
            var setting = new AppSetting("Pharos Demo API Key", '');
            setting.userCanDelete = false;
            setting.help = "What is your API key for APTrust's demo system? Hint: You have to request this from help@aptrust.org.";
            setting.save();
            installed.push("Pharos Demo API Key");
        }
        if (AppSetting.findByName("Pharos Production API Login") == null) {
            var setting = new AppSetting("Pharos Production API Login", '');
            setting.userCanDelete = false;
            setting.help = "What email address do you use to log in to Pharos on APTrust's production system?";
            setting.save();
            installed.push("Pharos Production API Login");
        }
        if (AppSetting.findByName("Pharos Production API Key") == null) {
            var setting = new AppSetting("Pharos Production API Key", '');
            setting.userCanDelete = false;
            setting.help = "What is your API key for APTrust's production system? Hint: You have to request this from help@aptrust.org.";
            setting.save();
            installed.push("Pharos Production API Key");
        }
        var message = "Required APTrust application variables are already installed.";
        if (installed.length > 0) {
            message = "Installed required APTrust application variables: " + installed.join(', ');
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
        var message = "Required APTrust BagIt profiles are already installed.";
        if (installed.length > 0) {
            message = "Installed BagIt profiles: " + installed.join(', ');
        }
        return message;
    }

    // Install storage services required by APTrust
    installStorageServices() {
        // StorageService won't load at the top level. Why??
        var { StorageService } = require('../../core/storage_service');
        var installed = [];
        if (!StorageService.find(builtinServices.APTrustDemoId)) {
            builtinServices.APTrustDemoService.save();
            installed.push("APTrust Demo Storage");
        }
        if (!StorageService.find(builtinServices.APTrustProdId)) {
            builtinServices.APTrustProdService.save();
            installed.push("APTrust Production Storage");
        }
        var message = "Required APTrust storage services are already installed.";
        if (installed.length > 0) {
            message = "Installed storage services: " + installed.join(', ');
        }
        return message;
    }

    // _initFields sets up the questions the user will have to answer.
    // Questions will be presented in the order they are added.
    _initFields() {
        this.fields.push(this._getOrgNameField());
        this.fields.push(this._getDomainField());
        this.fields.push(this._getAccessField());
        this.fields.push(this._getBaggingDirField());
        this.fields.push(this._getAwsAccessKeyIdField());
        this.fields.push(this._getAwsSecretAccessKeyField());
    }

    _getOrgNameField() {
        var orgName = this._getSetupField('orgName', 'Organization Name');
        var orgNameFromProfile = '';
        var aptrustProfile = BagItProfile.find(builtinProfiles.APTrustProfileId);
        if (aptrustProfile) {
            var tag = aptrustProfile.findTagByName("Source-Organization");
            if (tag) {
                orgNameFromProfile = tag.defaultValue;
            }
        }
        orgName.value = orgNameFromProfile;
        orgName.help = OrgNameHelp;
        orgName.validator = function(value) {
            orgName.value = value;
            if (value != null && value.length > 1) {
                // If value is OK, copy it into the APTrust BagIt profile.
                // Must re-read profile from DB, as it may have picked up other edits during setup.
                var aptrustProfile = BagItProfile.find(builtinProfiles.APTrustProfileId);
                if (aptrustProfile) {
                    var tag = aptrustProfile.findTagByName("Source-Organization");
                    if (tag) {
                        tag.defaultValue = value;
                        aptrustProfile.save();
                        orgName.error = '';
                        return true;
                    }
                }
            }
            orgName.error = "Please enter your organization name.";
            return false;
        }
        return orgName;
    }

    _getDomainField() {
        // StorageService won't load at the top level. Why??
        var { StorageService } = require('../../core/storage_service');
        var domain = this._getSetupField('domain', 'Domain Name');
        var setting = AppSetting.findByName("Institution Domain");
        if (setting) {
            domain.value = setting.value;
        }
        domain.help = DomainHelp;
        domain.validator = function(value) {
            domain.value = value;
            // If value is OK, save it into AppSettings.
            if(value && value.match(domainNamePattern)) {
                if (setting) {
                    setting.value = value;
                    setting.save();
                    var prodService = StorageService.find(builtinServices.APTrustProdId);
                    if (prodService) {
                        prodService.bucket = 'aptrust.receiving.' + value;
                        prodService.save();
                    }
                    var demoService = StorageService.find(builtinServices.APTrustDemoId);
                    if (demoService) {
                        demoService.bucket = 'aptrust.receiving.test.' + value;
                        demoService.save();
                    }
                }
                domain.error = "";
                return true
            }
            domain.error = "Please enter a valid domain name.";
            return false;
        }
        return domain;
    }

    _getAccessField() {
        var access = this._getSetupField('access', 'Default Access Policy');
        var accessFromProfile = 'Institution'; // sensible default
        var aptrustProfile = BagItProfile.find(builtinProfiles.APTrustProfileId);
        if (aptrustProfile) {
            var tag = aptrustProfile.findTagByName("Access");
            if (tag) {
                accessFromProfile = tag.defaultValue;
            }
        }
        var accessValues = ['Consortia', 'Institution', 'Restricted'];
        access.choices = Choice.makeList(accessValues, accessFromProfile, false);
        access.help = AccessHelp;
        access.validator = function(value) {
            access.value = value;
            if (value != null && value != '') {
                // If value is OK, copy it into the APTrust BagIt profile.
                // Must re-read profile from DB, as it may have picked up other edits during setup.
                var aptrustProfile = BagItProfile.find(builtinProfiles.APTrustProfileId);
                if (aptrustProfile) {
                    var tag = aptrustProfile.findTagByName("Access");
                    if (tag) {
                        tag.defaultValue = value;
                        aptrustProfile.save();
                        access.error = '';
                        return true;
                    }
                }
            }
            access.error = "Please select either Consortia, Institution, or Restricted.";
            return false;
        }
        return access;
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

    _getAwsAccessKeyIdField() {
        // StorageService won't load at the top level. Why??
        var { StorageService } = require('../../core/storage_service');
        var awsAccessKeyId = this._getSetupField('awsAccessKeyId', 'AWS Access Key ID');
        var prodService = StorageService.find(builtinServices.APTrustProdId);
        var demoService = StorageService.find(builtinServices.APTrustDemoId);
        var service = prodService || demoService;
        if (service) {
           awsAccessKeyId.value = service.loginName;
        }
        awsAccessKeyId.help = AwsAccessKeyIdHelp;
        awsAccessKeyId.attrs['required'] = false;
        awsAccessKeyId.validator = function(value) {
            awsAccessKeyId.value = value;
            // Must re-read service records from DB, since they may have picked
            // up some new edits during the setup process.
            var prodService = StorageService.find(builtinServices.APTrustProdId);
            var demoService = StorageService.find(builtinServices.APTrustDemoId);
            if (value && value.length >= 16 && value.length<= 128) {
                if (prodService) {
                    prodService.loginName = value;
                    prodService.save();
                }
                if (demoService) {
                    demoService.loginName = value;
                    demoService.save();
                }
                awsAccessKeyId.error = "";
                return true;
            }
            awsAccessKeyId.error = "Value should be between 16 and 128 characters long.";
            return false;
        }
        return awsAccessKeyId;
    }

    _getAwsSecretAccessKeyField() {
        // StorageService won't load at the top level. Why??
        var { StorageService } = require('../../core/storage_service');
        var awsSecretAccessKey = this._getSetupField('awsSecretAccessKey', 'AWS Secret Access Key');
        var prodService = StorageService.find(builtinServices.APTrustProdId);
        var demoService = StorageService.find(builtinServices.APTrustDemoId);
        var service = prodService || demoService;
        if (service) {
           awsSecretAccessKey.value = service.loginPassword;
        }
        awsSecretAccessKey.help = AwsSecretKeyHelp;
        awsSecretAccessKey.attrs['required'] = false;
        awsSecretAccessKey.validator = function(value) {
            awsSecretAccessKey.value = value;
            // Must re-read service records from DB, since they may have picked
            // up some new edits during the setup process.
            var prodService = StorageService.find(builtinServices.APTrustProdId);
            var demoService = StorageService.find(builtinServices.APTrustDemoId);
            if (value && value.length >= 16 && value.length<= 128) {
                if (prodService) {
                    prodService.loginPassword = value;
                    prodService.save();
                }
                if (demoService) {
                    demoService.loginPassword = value;
                    demoService.save();
                }
                awsSecretAccessKey.error = "";
                return true;
            }
            awsSecretAccessKey.error = "Value should be between 16 and 128 characters long.";
            return false;
        }
        return awsSecretAccessKey;
    }

    // _getSetupField is a utility function that returns a Field object for a
    // question on your setup form.
    _getSetupField(name, label) {
        var field = new Field(name, name, label, '');
        field.attrs['required'] = true;
        return field;
    }
}

module.exports.Provider = APTrust;
module.exports.name = name;
module.exports.description = description;
module.exports.version = version;
