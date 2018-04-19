const { AppSetting } = require('../../core/app_setting');
const log = require('../../core/log');
const path = require('path');
const request = require('request');
const { Util } = require('../../core/util');

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
        if (instDomain && this.uploadResult && this.uploadResult.remoteUrl) {
            let demoBucketName = `aptrust.receiving.test.${instDomain}`
            if (this.uploadResult.remoteUrl.includes(demoBucketName)) {
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

    _noWorkItemRecord() {
        let html =  '<div class="text-info">APTrust does not yet have a WorkItem record for this bag.</div>';
        this.emitter.emit('complete', this.job.id, html);
    }

    // Be sure to check WorkItem first, because the etag in the WorkItems
    // table can distinguish between the this job's version of a bag and
    // a prior job's version.
    _getIntellectualObject() {
        let repo = this;
        let conn = this._connectionInfo();
        let baseUrl = `${conn.url}/api/${apiVersion}`
        let identifier = path.basename(this.job.packagedFile);

        if (this.uploadResult == null) {
            this._notYetUploaded();
            return;
        }
        if (!this._canConnect(conn)) {
            this._displayCantGetInfo(identifier);
            return;
        }

        // objects endpoint uses Obj Idenfier, like "test.edu/test.edu.bagname"
        let objIdentifier = `${this._getSetting("Institution Domain")}/${identifier.replace(/\.tar$/, '')}`
        let encodedObjIdentifier = encodeURIComponent(objIdentifier);
        let objectUrl = `${baseUrl}/objects/${encodedObjIdentifier}`;

        // items endpoint uses tar file name, like "test.edu.bagname.tar"
        let encodedTarFileName = encodeURIComponent(identifier);
        let etag = this.uploadResult.remoteChecksum;
        let workItemUrl = null;
        if (etag) {
            workItemUrl = `${baseUrl}/items/?name=${encodedTarFileName}&etag=${etag}&sort=date`;
        }
        if (workItemUrl === null) {
            repo._displayCantGetInfo(identifier);
            return;
        }

        let options = {
            url: workItemUrl,
            headers: this._getHeaders(conn)
        };

        var intelObjectCallback = function(error, response, body) {
            if (!error && response.statusCode == 404) {
                // Not ingested yet.
            } else if (!error && response.statusCode == 200) {
                var data = JSON.parse(body);
                repo._formatObjectRecord(data, objectUrl);
            } else {
                repo._formatError(error, response, body);
            }
        }

        var getIntelObject = function() {
            if (objectUrl === null) {
                repo._displayCantGetInfo(identifier);
            } else {
                options.url = objectUrl;
                log.debug(`Requesting Object: ${options.url}`);
                request(options, intelObjectCallback);
            }
        }

        var workItemCallback = function (error, response, body) {
            if (response.statusCode == 404) {
                repo._noWorkItemRecord();
            } else if (!error && response.statusCode == 200) {
                var data = JSON.parse(body);
                if (data.results.length > 0 && data.results[0].object_identifier) {
                    // Item was ingested. Get the Object record.
                    getIntelObject();
                } else {
                    // Not ingested yet. Show the WorkItem.
                    repo._formatWorkItem(data, workItemUrl);
                }
            }
        }

        // Try to get the WorkItem from Pharos.
        log.debug(`Requesting WorkItem: ${options.url}`);
        request(options, workItemCallback);
    }

    _displayCantGetInfo(identifier) {
        let msg = `Not enough info to look up ${identifier}`;
        let html = `<div class="text-info">${msg}</div>`;
        log.info(msg);
        this.emitter.emit('complete', this.job.id, html);
    }

    _formatWorkItem(data, workItemUrl) {
        if (data.results.length == 0) {
            let html = `<div>Item has not yet been queued for ingest.</div>`;
            this.emitter.emit('complete', this.job.id, html);
            return;
        }
        let workItem = data.results[0];
        let cssClass = 'text-info';
        if (workItem.status == 'Success') {
            cssClass = 'text-success';
        } else if (workItem.status == 'Failed') {
            cssClass = 'text-danger';
        }
        let truncatedNote = Util.truncateString(workItem.note, 80);
        let link = `<a href="javascript:es.openExternal('${workItemUrl}')">View Work Item in Pharos</a>`;
        let html = `<div class="${cssClass}">${workItem.status}: ${truncatedNote}<br/>${link}</div>`;
        this.emitter.emit('complete', this.job.id, html);
    }

    _formatObjectRecord(data, objectUrl) {
        let truncatedTitle = Util.truncateString(data.title, 80);
        let date = new Date(data.updated_at).toDateString();
        let link = `<a href="javascript:es.openExternal('${objectUrl}')">View Object in Pharos</a>`;
        let html = `<div class="text-success">Ingested <i>"${truncatedTitle}"</i> on ${date}<br/>${link}</div>`;

        // Since Pharos has an object record, we know this item
        // was ingested. So let's mark the timestamp on the job.
        if (this.job.ingestedAt == null) {
            log.info(`Setting ingestedAt timestamp for ${this.job.bagName}`);
            this.job.ingestedAt = data.updated_at;
            this.job.save();
        }

        this.emitter.emit('complete', this.job.id, html);
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
