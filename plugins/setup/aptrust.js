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


/**
 * APTrustSetup provides a walk-through setup for DART users
 * to create a basic APTrust environment.
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

    postQuestionCallback() {
        // TODO: Copy AWS Demo and prod credentials from the
        // receiving StorageServices to the restoration StorageServices.
    }
}

module.exports = APTrustSetup;
