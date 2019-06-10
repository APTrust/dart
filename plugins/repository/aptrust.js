const { AppSetting } = require('../../core/app_setting');
const { Plugin } = require('../plugin');
const { RemoteRepository } = require('../../core/remote_repository');

// These ids come from plugins/setup/aptrust/remote_repositories.json
const APTRUST_DEMO_REPO_ID = "214db814-bd73-49d4-b988-4d7a5ad0d313";
const APTRUST_PROD_REPO_ID = "f95edae2-dff5-4ea7-bd3e-9546246d46e9";

/**
 * APTrustClient provides methods for querying an APTrust repository
 * that conform to the DART repository interface.
 *
 *
 */
class APTrustClient extends Plugin {
    /**
     *
     */
    constructor() {
        super();
        let setting = AppSetting.find('name', 'Institution Domain');
        if (setting) {
            this.institutionDomain = setting.value;
        }
        this.demoRepo = RemoteRepository.find(APTRUST_DEMO_REPO_ID);
        this.prodRepo = RemoteRepository.find(APTRUST_PROD_REPO_ID);
    }

    /**
     * Returns a {@link PluginDefinition} object describing this plugin.
     *
     * @returns {PluginDefinition}
     */
    static description() {
        return {
            id: 'c5a6b7db-5a5f-4ca5-a8f8-31b2e60c84bd',
            name: 'APTrustClient',
            description: 'APTrust repository client. This allows DART to talk to the APTrust demo and/or production repository.',
            version: '0.1',
            readsFormats: [],
            writesFormats: [],
            implementsProtocols: [],
            talksToRepository: ['aptrust'],
            setsUp: []
        };
    }

    /**
     * This returns a list of recently ingested objects. The return value
     * is a string of HTML to be displayed directly in the dashboard.
     *
     * @returns {string}
     */
    recentIngests() {

    }

    /**
     * This returns a list of Pharos Work Items, which describe pending
     * ingest requests and other tasks. Items uploaded for ingest that have
     * not yet been processed will be in this list.
     *
     * @returns {string}
     */
    recentTasks() {

    }

    /**
     * This returns true if the RemoteRepository object has enough info to
     * attempt a connection. (For APTrust, we require url, userId, and apiToken.
     *
     * @param {RemoteRepository} repo - The RemoteRepository to connect to.
     * This should be either this.demoRepo or this.prodRepo.
     *
     * @returns {boolean}
     */
    _canConnect(repo) {
        return repo.url && repo.user && repo.apiKey;
    }

    /**
     * Returns the HTTP request headers our client will need to send when
     * connecting to Pharos.
     *
     * @param {RemoteRepository} repo - The RemoteRepository to connect to.
     * This should be either this.demoRepo or this.prodRepo.
     *
     * @returns {object}
     */
    _getHeadersFor(repo) {
        return {
            'User-Agent': `DART ${Context.dartReleaseNumber()} / Node.js request`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Pharos-API-User': repo.getValue('userId'),
            'X-Pharos-API-Key': repo.getValue('apiToken')
        }
    }

    _getObjectsUrl() {
        return `/member-api/v2/objects/${this.userDomain}/?page=1&per_page=50&sort=date&state=A`
    }

    _getItemsUrl() {
        return `/member-api/v2/items/${this.userDomain}/?page=1&per_page=50&sort=date`
    }

}

module.exports = APTrustClient;
