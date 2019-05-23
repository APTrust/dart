const { AppSetting } = require('../../core/app_setting');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { Constants } = require('../../core/constants');
const { Context } = require('../../core/context');
const { InternalSetting } = require('../../core/internal_setting');
const os = require('os');
const path = require('path');
const { Plugin } = require('../plugin');
const { PluginManager } = require('../plugin_manager');
const { RemoteRepository } = require('../../core/remote_repository');
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

    /**
     * This message will appear before the user sees the first of the setup
     * questions.
     *
     * @returns {string}
     */
    startMessage() {
        return Context.y18n.__("The APTrust setup process will install required APTrust settings, and will ask you to answer a series of %s questions. If you are an APTrust member and you have questions or run into problems, contact us at %s for assistance. Click Next to continue.", $this.fields.length, "<a href='mailto:help@aptrust.org'>help@aptrust.org</a>");
    }

    /**
     * This message will appear when the user completes the setup process.
     *
     * @returns {string}
     */
    endMessage() {
        return Context.y18n.__("APTrust setup is complete. See the Help link in the menu above for information on how to add or change the settings, or select Job from the menu above to create a new job.");
    }

    /**
     * The setup runner calls this after startMessage(). Use this to
     * run any code you want before the user starts answering the series
     * of setup questions. If this code throws any exceptions, they will
     * be displayed to the user.
     *
     * APTrust uses this method to install custom AppSettings, BagIt Profiles,
     * InternalSettings, RemoteRepositories, and StorageServices.
     *
     * Internally, this method can install items in any order it pleases.
     */
    preQuestionCallback() {
        this._installAppSettings();
        this._installBagItProfiles();
        this._installRemoteRepositories();
        this._installStorageServices();
        this._installInternalSettings();
    }

    /**
     * The setup runner calls this after the user has answered all
     * questions and before the endMessage() appears.
     *
     */
    postQuestionCallback() {
        this._setCompletionTimestamp();
    }

    /**
     * This sets up the questions the user will have to answer.
     * Questions will be presented one at a time in the order they
     * were added.
     *
     */
    _initFields() {
        // Load setup questions from JSON?
    }


    /**
     * This installs a number of BagIt profiles required by APTrust.
     * See {@link BagItProfile}.
     *
     * @private
     */
    _installBagItProfiles() {
        let aptrustId = Constants.BUILTIN_PROFILE_IDS['aptrust'];
        let dpnId = Constants.BUILTIN_PROFILE_IDS['dpn'];
        let builtinDir = path.join('..', '..', 'builtin');
        if (!BagItProfile.find(aptrustId)) {
            this._installProfile('APTrust v2.2', path.join(builtinDir, 'aptrust_bagit_profile_2.2.json'));
        }
        if (!BagItProfile.find(dpnId)) {
            this._installProfile('DPN v2.1', path.join(builtinDir, 'dpn_bagit_profile_2.1.json'));
        }
    }

    /**
     * This installs a BagItProfile.
     *
     * @private
     */
    _installProfile(profileName, pathToFile) {
        let profile = BagItProfile.load(pathToFile);
        profile.save();
        Context.logger.info(Context.y18n.__("APTrust Setup installed BagItProfile %s", profileName));
    }

    /**
     * This installs InternalSettings required by APTrust.
     * Users cannot edit InternalSettings. See {@link InternalSetting}.
     *
     * @private
     */
    _installInternalSettings() {
        // No required internal settings for APTrust.
    }

    /**
     * This creates or updates an internal setting describing when the
     * APTrust setup plugin was last run.
     *
     * @private
     */
    _setCompletionTimestamp() {
        let aptSetupRecord = InternalSetting.firstMatching('name', 'APTrust Setup');
        if (!aptSetupRecord) {
            aptSetupRecord = new InternalSetting({ name: 'APTrust Setup' });
        }
        aptSetupRecord.value = new Date().toISOString();
        aptSetupRecord.save();
    }

}

module.exports = APTrustSetup;
