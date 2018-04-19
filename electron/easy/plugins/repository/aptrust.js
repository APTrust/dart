const { AppSetting } = require('../../core/app_setting');
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
    // emitter comes from plugins.newRepoEmitter()
    constructor(job, emitter) {
        this.job = job;
        this.emitter = emitter;

        this.uploadResult = job.operationResults.find(r => r.provider === "APTrust S3 uploader") || null;
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
        if (this.uploadResult == null) {
            this.emitter.emit('complete', this.job.id, this._notYetUploaded());
        }
        if (!this._canConnect) {
            this.emitter.emit('complete', this.job.id, '');
        }
        this._getIntellectualObject();
    }

    // -----------------------------------------------------------------
    // All methods below are private.
    // -----------------------------------------------------------------

    // Jobs run by early beta users do not have properties remoteChecksum
    // or remoteUrl on the OperationResult object, so we can't deduce
    // which repository they uploaded to. If we can't figure that out,
    // don't try to run a query.
    _canConnect(conn) {
        if (conn.url && conn.user && conn.apiKey) {
            return true;
        }
        return false;
    }

    _connectionInfo() {
        let conn = {
            url: null,
            user: null,
            apiKey: null
        };
        let instDomain = this._getSetting("Institution Domain")
        if (instDomain) {
            let demoBucketName = `aptrust.receiving.test.${instDomain}`
            if (this.uploadResult.remoteUrl && this.uploadResult.remoteUrl.includes(demoBucketName)) {
                conn.url = this._getSetting("Pharos Demo URL");
                conn.user = this._getSetting("Pharos Demo API Login");
                conn.apiKey = this._getSetting("Pharos Demo API Key");
            } else {
                conn.url = this._getSetting("Pharos Production URL");
                conn.user = this._getSetting("Pharos Production API Login");
                conn.apiKey = this._getSetting("Pharos Production API Key");
            }
        }
        return conn;
    }

    _getHeaders(conn) {
        return {
            'User-Agent': 'DART / Node.js request',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Pharos-API-User': conn.user,
            'X-Pharos-API-Key': conn.apiKey
        }
    }

    _getSetting(settingName) {
        let setting = AppSetting.findByName(settingName);
        if (setting) {
            return setting.value;
        }
        return null;
    }

    _notYetUploaded() {
        let html =  '<div class="text-info">This bag has not been uploaded to APTrust.</div>';
        this.emitter.emit('complete', this.job.id, html);
    }

    _getIntellectualObject() {
        let repo = this;
        let identifier = path.basename(this.job.packagedFile);
        let conn = this._connectionInfo();

        // if (this._canConnect(conn) === false) {
        //     console.log(`Cannot check Pharos for ${identifier}: not enough info`);
        //     return;
        // }

        // if (identifier.includes('April')) {
        //     console.log(this.uploadResult)
        // }

        let baseUrl = `${conn.url}/api/${apiVersion}`
        let encodedIdentifier = encodeURIComponent(identifier);
        let objectUrl = `${baseUrl}/objects/${encodedIdentifier}`;
        let etag = this.uploadResult.remoteChecksum;
        let workItemUrl = null;
        if (etag) {
            workItemUrl = `${baseUrl}/items/?name=${encodedIdentifier}&etag=${etag}&sort=date`;
        }
        let options = {
            url: objectUrl,
            headers: this._getHeaders(conn)
        };

        var workItemCallback = function (error, response, body) {
            if (response.statusCode == 404) {
                // No work item
            } else if (!error && response.statusCode == 200) {
                var data = JSON.parse(body);
                repo._formatWorkItemRecord(data);
            } else {
                repo._formatError(error, response, body);
            }
        }

        var getWorkItem = function() {
            if (workItemUrl === null) {
                repo._displayCantGetInfo(identifier);
            } else {
                options.url = workItemUrl;
                log.debug(`Requesting WorkItem: ${options.url}`);
                request(options, workItemCallback);
            }
        }

        var intelObjectCallback = function(error, response, body) {
            if (!error && response.statusCode == 404) {
                // Not ingested yet. Check for pending WorkItem.
                getWorkItem();
            } else if (!error && response.statusCode == 200) {
                var data = JSON.parse(body);
                repo._formatObjectRecord(data);
            } else {
                repo._formatError(error, response, body);
            }
        }

        // Try to get the intellectual object from Pharos.
        log.debug(`Requesting IntellectualObject: ${options.url}`);
        request(options, intelObjectCallback);
    }

    // _getWorkItem() {
    //     let conn = this._connectionInfo();
    //     let identifier = path.basename(this.job.packagedFile);
    //     let encodedIdentifier = encodeURIComponent(identifier);
    //     let etag = this.uploadResult.remoteChecksum;
    //     let url = `${this.apiUrl}/items/?name=${encodedIdentifier}&etag=${etag}&sort=date&page=1&per_page=1`;
    //     log.debug(`Requesting WorkItem: ${url}`);
    //     var options = {
    //         url: conn.url,
    //         headers: this._getHeaders(conn)
    //     };
    //     request(options, this._workItemCallback);
    // }

    // _intelObjectCallback(error, response, body) {
    //     if (!error && response.statusCode == 404) {
    //         // Not ingested yet. Check for pending WorkItem.
    //         this._getWorkItem();
    //     } else if (!error && response.statusCode == 200) {
    //         var data = JSON.parse(body);
    //         this._formatObjectRecord(data);
    //     } else {
    //         this._formatError(error, response, body);
    //     }
    // }

    // _workItemCallback(error, response, body) {
    //     if (response.statusCode == 404) {
    //         // No work item
    //     } else if (!error && response.statusCode == 200) {
    //         var data = JSON.parse(body);
    //         this._formatWorkItemRecord(data);
    //     } else {
    //         this._formatError(error, response, body);
    //     }
    // }

    _displayCantGetInfo(identifier) {
        console.log(`Can't get WorkItem info for ${identifier}`);  //'
    }

    _formatWorkItem(data) {
        console.log(data);
    }

    _formatObjectRecord(data) {
        console.log(data);
    }

    _formatError(error, response, body) {
        let errMsg = error;
        if (errMsg == null) {
            try {
                let data = JSON.parse(body);
                errMsg = data.error;
            } catch(err) {
                log.error(`Cannot parse Pharos error message`);
            }
        }
        let message = `Error in request to APTrust: ${errMsg}`;
        console.log(message);
        log.error(message);
        log.error(body);
        let html = `<div class="text-warning">${message}</div>`
        this.emitter.emit('complete', this.job.id, html);
    }
}

module.exports.Provider = APTrust;
module.exports.name = name;
module.exports.description = description;
module.exports.version = version;
