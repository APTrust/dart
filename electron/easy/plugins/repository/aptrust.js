const request = require('request');

// Constants required for all repository plugins.
const name = "APTrust";
const description = "APTrust Repository";
const version = "0.1";

// These constants are specific to APTrust.
const apiVersion = 'v2';

class APTrust {

    // url is the base url of the repository.
    // E.g. https://demo.aptrust.org or https://repo.aptrust.org
    //
    // authData is a hash of info required for authentication.
    // For APTrust, that's apiAuthToken.
    //
    // emitter comes from plugins.newRepoEmitter()
    constructor(url, authData, emitter) {
        this.url = url;
        this.authData = authData;
        this.emitter = emitter;

        // All REST API URLs start with this
        this.apiUrl = `${url}/api/${apiVersion}/`

        // Default HTTP headers sent with every request to
        // the repo's REST API.
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Token token=${authData.apiAuthToken}`
        }
    }

    describe() {
        return {
            name: name,
            description: description,
            version: version,
            url: this.url
        }
    }

    // data is a hash of whatever data you need to query
    // the remote repository.
    getObjectInfo(data) {
        this.emitter.emit('start');

    }

    _getWorkItem(identifier) {

    }

    _getIntellectualObject(identifier) {
        let encodedIdentifier = encodeURIComponent(identifier);
        let url = `${this.apiUrl}/objects/${encodedIdentifier};
    }

    _formatResult(data) {

    }

    _formatWorkItem(data) {

    }

    _formatObjectRecord(data) {

    }
}
