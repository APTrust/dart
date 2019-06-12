const { AppSetting } = require('../../core/app_setting');
const { Context } = require('../../core/context');
const { RemoteRepository } = require('../../core/remote_repository');
const path = require('path');
const { RepositoryBase } = require('./repository_base');
const request = require('request');
const Templates = require('../../ui/common/templates');

/**
 * APTrustClient provides methods for querying an APTrust repository
 * that conform to the DART repository interface.
 *
 *
 */
class APTrustClient extends RepositoryBase {
    /**
     *
     */
    constructor(remoteRepository) {
        super(remoteRepository);
        let setting = AppSetting.find('name', 'Institution Domain');
        if (setting) {
            this.institutionDomain = setting.value;
        }
        //this.repo = remoteRepository;
        this.objectsUrl = `${this.repo.url}/member-api/v2/objects/?page=1&per_page=50&sort=date&state=A`
        this.itemsUrl = `${this.repo.url}/member-api/v2/items/?page=1&per_page=50&sort=date`

        this.objectsTemplate = Templates.compile(path.join(__dirname, 'aptrust', 'objects.html'));
        this.itemsTemplate = Templates.compile(path.join(__dirname, 'aptrust', 'work_items.html'));
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

    provides() {
        let aptrust = this;
        return [
            {
                title: `Ingested Objects (${this.repo.name})`,
                description: 'Recently ingested objects.',
                method: () => { return aptrust.recentIngests() }
            },
            {
                title: 'Work Items  (${this.repo.name})',
                description: 'A list of tasks.',
                method: () => { return aptrust.recentWorkItems() }
            }
        ];
    }


    /**
     * This returns a list of recently ingested objects. The return value
     * is a string of HTML to be displayed directly in the dashboard.
     *
     * @returns {Promise}
     */
    recentIngests() {
        let aptrust = this;
        return this._doRequest(this.objectsUrl, (data) => {
            data.results.forEach((item) => {
                item.url = `${aptrust.repo.url}/objects/${encodeURIComponent(item.identifier)}`;
                item.escaped_title = item.title.replace(/"/g, "'");
            });
            return aptrust.objectsTemplate({ objects: data.results })
        });
    }

    /**
     * This returns a list of Pharos Work Items, which describe pending
     * ingest requests and other tasks. Items uploaded for ingest that have
     * not yet been processed will be in this list.
     *
     * @returns {Promise}
     */
    recentWorkItems() {
        let aptrust = this;
        return this._doRequest(this.itemsUrl, (data) => {
            data.results.forEach((item) => {
                item.url = `${aptrust.repo.url}/items/${item.id}`;
                item.escaped_note = item.note.replace(/"/g, "'");
            });
            return aptrust.itemsTemplate({ items: data.results })
        });
    }


    _doRequest(url, formatter) {
        let aptrust = this;
        return new Promise(function(resolve, reject) {
            aptrust._request(url, function(data) {
                //console.log(formatter.data);
                resolve(formatter(data));
            }, function(error) {
                reject(error);
            });
        });
    }


    /**
     * This returns true if the RemoteRepository object has enough info to
     * attempt a connection. (For APTrust, we require url, userId, and apiToken.
     *
     * @returns {boolean}
     */
    hasRequiredConnectionInfo() {
        return this.repo.url && this.repo.userId && this.repo.apiToken;
    }

    /**
     * Returns the HTTP request headers our client will need to send when
     * connecting to Pharos.
     *
     * @returns {object}
     */
    _getHeaders() {
        return {
            'User-Agent': `DART ${Context.dartReleaseNumber()} / Node.js request`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Pharos-API-User': this.repo.getValue('userId'),
            'X-Pharos-API-Key': this.repo.getValue('apiToken')
        }
    }

    _request(url, onSuccess, onError) {
        let opts = {
            url: url,
            method: 'GET',
            headers: this._getHeaders()
        }
        Context.logger.info(`Requesting ${url}`);
        request(opts, (err, res, body) => {
            if (err) {
                Context.logger.error(`Error from ${url}:`);
                Context.logger.error(err);
                onError(err, res, body);
            }
            if (res.statusCode == 200) {
                //Context.logger.info(body);
                onSuccess(JSON.parse(body));
            }
        });
    }

}

module.exports = APTrustClient;
