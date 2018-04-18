const log = require('../../core/log');
const path = require('path');
const request = require('request');

// Constants required for all repository plugins.
const name = "APTrust";
const description = "APTrust Repository";
const version = "0.1";

// These constants are specific to APTrust.
const apiVersion = 'v2';

class APTrust {

    // job is the job you want to query the remote repository
    // about. The Job object contains the bag name and other
    // info, including the etag or checksum returned by the
    // remote storage service after upload.
    //
    // repoUrl is the base url of the repository.
    // E.g. https://demo.aptrust.org or https://repo.aptrust.org
    //
    // authData is a hash of info required for authentication.
    // For APTrust, that's apiAuthToken.
    //
    // emitter comes from plugins.newRepoEmitter()
    constructor(job, repoUrl, authData, emitter) {
        this.repoUrl = repoUrl;
        this.authData = authData;
        this.emitter = emitter;

        // All REST API URLs start with this
        this.apiUrl = `${repoUrl}/api/${apiVersion}/`

        // Default HTTP headers sent with every request to
        // the repo's REST API.
        this.defaultHeaders = {
            'User-Agent': 'DART / Node.js request',
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

    // getObjectInfo gets object info from the remote repository.
    // The dashboard calls this method to display info about the job.
    getObjectInfo() {
        this.emitter.emit('start');
        let uploadResult = null;
        if (this.job.operationResults && this.job.operationResults.length > 0) {
            uploadResult = this.job.operationResults.filter(r => r.provider = "APTrust S3 uploader");
        }
        if (!uploadResult) {
            this.emitter.emit('complete', this.job.id, this._notYetUploaded());
        }
        _getIntellectualObject();
    }

    // -----------------------------------------------------------------
    // All methods below are private.
    // -----------------------------------------------------------------

    _notYetUploaded() {
        let html =  '<div class="text-info">This bag has not been uploaded to APTrust.</div>';
        this.emitter.emit('complete', this.job.id, html);
    }

    _getIntellectualObject() {
        let identifier = path.basename(this.job.packagedFile);
        let encodedIdentifier = encodeURIComponent(identifier);
        let url = `${this.apiUrl}/objects/${encodedIdentifier}`;
        log.debug(`Requesting IntellectualObject: ${url}`);
        var options = {
            url: url,
            headers: this.defaultHeaders
        };
        request(options, this._intelObjectCallback);
    }

    _getWorkItem() {
        let identifier = path.basename(this.job.packagedFile);
        let encodedIdentifier = encodeURIComponent(identifier);
        let uploadResult = this.job.operationResults.filter(r => r.provider = "APTrust S3 uploader");
        let etag = uploadResult.remoteChecksum;
        let url = `${this.apiUrl}/items/?name=${encodedIdentifier}&etag=${etag}&sort=date&page=1&per_page=1`;
        log.debug(`Requesting WorkItem: ${url}`);
        var options = {
            url: url,
            headers: this.defaultHeaders
        };
        request(options, this._workItemCallback);
    }

    _intelObjectCallback(error, response, body) {
        if (response.statusCode == 404) {
            // Not ingested yet. Check for pending WorkItem.
            this._getWorkItem();
        } else if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            this._formatObjectRecord(data);
        } else {
            this._formatError(error, response, body);
        }
    }

    _workItemCallback(error, response, body) {
        if (response.statusCode == 404) {
            // No work item
        } else if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            this._formatWorkItemRecord(data);
        } else {
            this._formatError(error, response, body);
        }
    }

    _formatWorkItem(data) {

    }

    _formatObjectRecord(data) {

    }

    _formatError(error, response, body) {
        log.error(`Error in request to APTrust: ${error}`);
        log.error(body);
        let html = `<div class="text-warning">Could not get info from APTrust: ${error}</div>`
        this.emitter.emit('complete', this.job.id, html);
    }
}
