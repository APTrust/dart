const { AppSetting } = require('../../core/app_setting');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { Constants } = require('../../core/constants');
const { Context } = require('../../core/context');
const os = require('os');
const path = require('path');
const { Plugin } = require('../plugin');
const { StorageService } = require('../../core/storage_service');

// Help messages for our setup questions.
const OrgNameHelp = Context.y18n.__("Enter the name of your organization. This name will be written into the Source-Organization field of the bag-info.txt file of each APTrust bag you create. Examples: 'University of Virginia', 'University of Virginia School of Law'.");
const DomainHelp = Context.y18n.__("Enter your institution's domain name. For example, 'unc.edu', 'virginia.edu'. If you will be depositing under a sub-account, enter your group's sub-domain. For example, 'med.virginia.edu', 'law.virginia.edu', etc.");
const BaggingDirHelp = Context.y18n.__("Where should the bagger assemble bags? This should be a directory name. Examples: 'c:\Users\josie\Documents\APTrustBags', '/User/josie/temp'.");
const AccessHelp = Context.y18n.__("Set the default access policy for your APTrust bags. Consortia means other APTrust depositors can see your bag's metadata (title and description), but not its contents. Insitution means all APTrust users from your institution can see this object's metadata. Restricted means only your institutional administrator can see that this bag exists. Institution is usually the safe default. You can override this setting for any individual bag.");
const AwsDemoAccessKeyIdHelp = Context.y18n.__("Enter your AWS Access Key ID for the DEMO environment. If you did not receive an AWS access key, contact help@aptrust.org to get one.");
const AwsDemoSecretKeyHelp = Context.y18n.__("Enter your AWS Secret Access Key for the DEMO environment. If you did not receive an AWS access key, contact help@aptrust.org to get one.");
const AwsProdAccessKeyIdHelp = Context.y18n.__("Enter your AWS Access Key ID for the PRODUCTION environment. If you did not receive an AWS access key, contact help@aptrust.org to get one.");
const AwsProdSecretKeyHelp = Context.y18n.__("Enter your AWS Secret Access Key for the PRODUCTION environment. If you did not receive an AWS access key, contact help@aptrust.org to get one.");
const PharosLoginHelp = Context.y18n.__("Enter the email address you use to log in to Pharos (APTrust's web UI and REST API).");
const PharosDemoAPIKeyHelp = Context.y18n.__("Enter your API key for the APTrust DEMO repository. You can get an API key by logging in to <a href='#Setup/openExternal?url=https://demo.aptrust.org'>https://demo.aptrust.org</a>. Click your login name in the upper right corner and select View Profile. Click the <b>Generate Secret API Key</b> button, then cut and paste the value here.");
const PharosProdAPIKeyHelp = Context.y18n.__("Enter your API key for the APTrust PRODUCTION repository. You can get an API key by logging in to <a href='#Setup/openExternal?url=https://repo.aptrust.org'>https://repo.aptrust.org</a>. Click your login name in the upper right corner and select View Profile. Click the <b>Generate Secret API Key</b> button, then cut and paste the value here.");

// The rest of the system doesn't need to know about these UUIDs,
// but this module will use them internally to check for upload
// targets.
const APT_RECEIVE_DEMO = '31b0846e-46f6-4925-bdba-1d3c1a0b2b73';
const APT_RECEIVE_PROD = 'b250bdfb-298d-4dc2-9816-3a5001604376';
const APT_RESTORE_DEMO = '12c7c92f-daf6-448e-83f0-310f2df40874';
const APT_RESTORE_PROD = 'dccf4a42-2281-4e93-aaaf-fb94e9458a0e';


// Regex patterns for validation.
const domainNamePattern = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
const macLinuxFilePattern = /(\/\w+)+/;  // This is a little simplistic. Looking for an absolute path.
const windowsFilePattern = /^(?:[a-z]:|\\\\[a-z0-9_.$-]+\\[a-z0-9_.$-]+)\\(?:[^\\\/:*?"<>|\r\n]+\\)*[^\\\/:*?"<>|\r\n]*$/i;

// Thank you, StackOverflow, for this bit of nastiness.
const emailPattern = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;


/**
 * APTrustSetup provides a walk-through setup for DART users
 * to create a basic APTrust environment.
 *
 *
 */
class APTrustSetup extends Plugin {
    /**
     *
     */
    constructor() {
        super();
        this.fields = [];
        this._initFields();
    }

    /**
     * Returns a {@link PluginDefinition} object describing this plugin.
     *
     * @returns {PluginDefinition}
     */
    static description() {
        return {
            id: 'd0a34f7f-a0f6-487b-86de-ece9b9a31189',
            name: 'APTrustSetup',
            description: Context.y18n.__('APTrust setup module. This helps users set up a basic APTrust configuration.'),
            version: '0.1',
            readsFormats: [],
            writesFormats: [],
            implementsProtocols: [],
            talksToRepository: [],
            setsUp: ['aptrust']
        };
    }

    startMessage() {
        return Context.y18n.__("The APTrust setup process will install required APTrust settings, and will ask you to answer a series of %s questions. If you are an APTrust member and you have questions or run into problems, contact us at <a href='mailto:help@aptrust.org'>help@aptrust.org</a> for assistance. Click <b>Next</b> to continue.", $this.fields.length);
    }

    endMessage() {
        return Context.y18n.__("APTrust setup is complete. See the Help link in the menu above for information on how to add or change the settings, or select Job from the menu above to create a new job.");
    }

       // Add app settings required by APTrust.
    installAppSettings() {
        if (AppSetting.firstMatching('name', 'Institution Domain') == null) {
            var setting = new AppSetting("Institution Domain", "example.org");
            setting.userCanDelete = false;
            setting.help = Context.y18n.__("Set this to the value of your organization's internet domain. This is a required setting. You cannot delete it. You can only change its value.");
            setting.save();
            installed.push("Institution Domain");
        }
        if (AppSetting.findByName('name', 'Bagging Directory') == null) {
            var dir = path.join(os.homedir(), "tmp", "dart");
            var setting = new AppSetting("Bagging Directory", dir);
            setting.userCanDelete = false;
            setting.help = Context.y18n.__("Where should DART create bags?");
            setting.save();
            installed.push("Bagging Directory");
        }
    }

    // Add required BagIt profiles
    installBagItProfiles() {
        let aptrustId = Constants.BUILTIN_PROFILE_IDS['aptrust'];
        let dpnId = Constants.BUILTIN_PROFILE_IDS['dpn'];
        if (!BagItProfile.find(aptrustId)) {
            let profile = BagItProfile.load(path.join('..', '..', 'builtin', 'aptrust_bagit_profile_2.2.json'));
            profile.save();
            Context.logger.info(Context.y18m.__("APTrust Setup installed APTrust BagIt profile"));
        }
        if (!BagItProfile.find(dpnId)) {
            let profile = BagItProfile.load(path.join('..', '..', 'builtin', 'dpn_bagit_profile_2.1.json'));
            profile.save();
            Context.logger.info(Context.y18m.__("APTrust Setup installed DPN BagIt profile"));
        }
    }

    // Install upload targets required by APTrust.
    installStorageServices() {
        if (!StorageService.find()) {
            builtinServices.APTrustDemoService.save();
            installed.push("APTrust Demo Storage");
        }
        if (!StorageService.find()) {
            builtinServices.APTrustProdService.save();
            installed.push("APTrust Production Storage");
        }
    }

}

module.exports = APTrustSetup;
