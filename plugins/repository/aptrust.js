const { AppSetting } = require('../../core/app_setting');
const { Context } = require('../../core/context');
const { RemoteRepository } = require('../../core/remote_repository');
const path = require('path');
const { RepositoryBase } = require('./repository_base');
const request = require('request');
const Templates = require('../../ui/common/templates');
const { Util } = require('../../core/util');

/**
 * APTrustClient provides methods for querying an APTrust repository
 * that conform to the DART repository interface.
 *
 * This repository plugin provides two reports: one listing recently
 * ingested objects, and one listing recently updated tasks. In APTrust
 * these tasks (also called WorkItems) describe the status of pending
 * ingest requests as well as other types of requests. The ingest
 * WorkItems are of most interest to depositors, since they show a bag's
 * progress through ingest pipeline.
 *
 * @param {RemoteRepository} remoteRepository - The repository to connect to.
 */
class APTrustClient extends RepositoryBase {

    constructor(remoteRepository) {
        super(remoteRepository);
        let setting = AppSetting.find('name', 'Institution Domain');
        if (setting) {
            this.institutionDomain = setting.value;
        }
        /**
         * The Pharos URL to query for a list of recently ingested objects.
         *
         * @type {string}
         * @private
         */
        this.objectsUrl = `${this.repo.url}/member-api/v2/objects/?page=1&per_page=50&sort=date&state=A`
        /**
         * The Pharos URL to query for a list of currently active and recently
         * active WorkItems.
         *
         * @type {string}
         * @private
         */
        this.itemsUrl = `${this.repo.url}/member-api/v2/items/?page=1&per_page=50&sort=date`
        /**
         * This is the path to the Handlebars template used to format results
         * from the object query. (Recently ingested items.)
         *
         * @type {string}
         * @private
         */
        this.objectsTemplate = Templates.compile(path.join(__dirname, 'aptrust', 'objects.html'));
        /**
         * This is the path to the Handlebars template used to format results
         * from the WorkItems query.
         *
         * @type {string}
         * @private
         */
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

    /**
     * This returns a list of objects describing what reports this
     * module provides. The DART dashboard queries this list to see
     * what method calls this plugin makes available. Each object in
     * the list this function returns has three properties.
     *
     * title - This is the title of the report. The dashboard will
     * display this title as is at the top of the report.
     *
     * description - A description of the report.
     *
     * method - A function to call to get the contents of the report.
     * The function takes no parameters and should a promis that
     * ultimately returns HTML. The dashboard will display the HTML
     * when the promise is resolved.
     *
     * @type {Array<object>}
     */
    provides() {
        let aptrust = this;
        console.log("Called provides()")
        return [
            {
                title: `Ingested Objects (${this.repo.name})`,
                description: 'Recently ingested objects.',
                method: () => { return aptrust.recentIngests() }
            },
            {
                title: `Work Items  (${this.repo.name})`,
                description: 'A list of tasks.',
                method: () => { return aptrust.recentWorkItems() }
            }
        ];
    }


    /**
     * This fetches a list of recently ingested objects from Pharos,
     * which is APTrust's REST API. After retrieving the data, this
     * function formats the list into an HTML table.
     *
     * This function returns a promise. The promise resolves to the
     * HTML, which DART will display in its Dashboard.
     *
     * @returns {Promise}
     */
    recentIngests() {
        let aptrust = this;
        return this._doRequest(this.objectsUrl, (data) => {
            data.results.forEach((item) => {
                item.url = `${aptrust.repo.url}/objects/${encodeURIComponent(item.identifier)}`;
                item.escapedTitle = item.title.replace(/"/g, "'");
                item.displayDate = item.updated_at.split('T')[0];
            });
            return aptrust.objectsTemplate({ objects: data.results })
        });
    }

    /**
     * This returns a list of Pharos Work Items, which describe pending
     * ingest requests and other tasks. Items uploaded for ingest that have
     * not yet been processed will be in this list.
     *
     * This function returns a promise. The promise resolves to the
     * HTML, which DART will display in its Dashboard.
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

    /**
     * This creates an HTTP(S) request and returns a promise.
     *
     * @param {string} url - The URL to fetch. For this module, all requests
     * will be GET requests.
     *
     * @param {formatter} function - The function to format the data, if it
     * is successfully retrieved. The formatter function should take a single
     * paramater, an object, which is constructed from the parsed JSON data
     * in the response body fetched from url.
     *
     * @returns {Promise}
     */
    _doRequest(url, formatter) {
        let aptrust = this;
        return new Promise(function(resolve, reject) {
            aptrust._request(url, function(data) {
                resolve(formatter(data));
            }, function(error) {
                reject(error);
            });
        });
    }


    /**
     * This returns true if the RemoteRepository object has enough info to
     * attempt a connection. For APTrust, we require url, userId, and apiToken.
     * Other repositories may require different data in their RemoteRepository
     * object.
     *
     * @returns {boolean}
     */
    hasRequiredConnectionInfo() {
        return !Util.isEmpty(this.repo.url) && !Util.isEmpty(this.repo.userId) && !Util.isEmpty(this.repo.apiToken);
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

    /**
     * This sends a GET request to url, calling the onSuccess callback
     * if it gets a 200 response, and the onError callback for all other
     * responses.
     *
     * Other repository plugins may need to support PUT, POST, and HEAD
     * requests, and may need more robust handling for different response
     * status codes.
     *
     * For APTrust, we're hitting only two endpoints, using only GET,
     * and we know that any non-200 response means something is wrong.
     *
     * Because we're using the request library from
     * https://github.com/request/request, the onSuccess and onError
     * functions take params (error, response, body), which are an
     * Error object, a Response object, and the body of the HTTP
     * response (which should be JSON).
     *
     * @param {string} url - The URL to get.
     *
     * @param {function} onSuccess - A function to handle successful
     * responses. Takes params (error, response, body).
     *
     * @param {function} onError - A function to handle errors.
     * Takes params (error, response, body).
     */
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
                onSuccess(JSON.parse(body));
            } else {
                let errMsg = res.headers.status;
                try {
                    let data = JSON.parse(body);
                    errMsg += ` - ${data.error}`
                } catch (ex) {}
                Context.logger.error(`Unexpected response from ${url}: ${errMsg}`);
                onError(errMsg);
            }
        });
    }

}

module.exports = APTrustClient;
