const { AppSetting } = require('../../core/app_setting');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { Constants } = require('../../core/constants');
const { Context } = require('../../core/context');
const { InternalSetting } = require('../../core/internal_setting');
const os = require('os');
const path = require('path');
const { PluginManager } = require('../plugin_manager');
const { RemoteRepository } = require('../../core/remote_repository');
const { SetupBase } = require('./setup_base');
const { StorageService } = require('../../core/storage_service');


/**
 * APTrustSetup provides a walk-through setup for DART users
 * to create a basic APTrust environment.
 *
 */
class APTrustSetup extends SetupBase {
    /**
     *
     */
    constructor() {
        super(path.join(__dirname, 'aptrust'));
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
            description: Context.y18n.__('This will help you set up the basic APTrust configuration.'),
            version: '0.1',
            readsFormats: [],
            writesFormats: [],
            implementsProtocols: [],
            talksToRepository: [],
            setsUp: ['aptrust']
        };
    }

    /**
     * This is called after each question, though we only need to take
     * action after selected questions.
     *
     */
    afterEachQuestion(setupQuestion) {
        if (setupQuestion && setupQuestion.id == 'q_domain') {
            let domainName = setupQuestion.readUserInput();
            this._setBucketNames(domainName);
        }
    }

    /**
     * Sets the names of the APTrust receiving and restoration buckets
     * based on the user's domain name.
     *
     */
    _setBucketNames(domainName) {
        // UUIDs come from setup/aptrust/storage_services.json
        //
        // APTrust Demo Receiving Bucket
        let ss = StorageService.find('31b0846e-46f6-4925-bdba-1d3c1a0b2b73');
        ss.bucket = 'aptrust.receiving.test.' + domainName
        ss.save();

        // APTrust Production Receiving Bucket
        ss = StorageService.find('b250bdfb-298d-4dc2-9816-3a5001604376');
        ss.bucket = 'aptrust.receiving.' + domainName
        ss.save();

        // APTrust Demo Restoration Bucket
        ss = StorageService.find('12c7c92f-daf6-448e-83f0-310f2df40874');
        ss.bucket = 'aptrust.restore.test.' + domainName
        ss.save();

        // APTrust Production Restoration Bucket
        ss = StorageService.find('dccf4a42-2281-4e93-aaaf-fb94e9458a0e');
        ss.bucket = 'aptrust.restore.' + domainName
        ss.save();
    }

}

module.exports = APTrustSetup;
