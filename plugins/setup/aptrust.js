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
        super(__dirname);
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
}

module.exports = APTrustSetup;
