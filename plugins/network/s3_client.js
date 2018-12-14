const { Plugin } = require('../plugin');

const MAX_ATTEMPTS = 10;

/**
 * S3Client provides access to S3 REST services that conforms to the
 * DART network client interface.
 *
 *
 */
module.exports = class S3Client extends Plugin {
    /**
     *
     */
    constructor(filepath, storageService) {
        super();
        this.filepath = filepath;
        this.storageService = storageService;
        this.localStat = null;
        this.result = new OperationResult('upload', S3Client.description().name);
        this.result.filename = filepath;
    }

    /**
     * Returns a {@link PluginDefinition} object describing this plugin.
     *
     * @returns {PluginDefinition}
     */
    static description() {
        return {
            id: '23a8f0af-a03a-418e-89a4-6d07799882b6',
            name: 'S3Client',
            description: 'Built-in DART S3 network client',
            version: '0.1',
            readsFormats: [],
            writesFormats: [],
            implementsProtocols: ['s3'],
            talksToRepository: [],
            setsUp: []
        };
    }

    upload() {
        try {
            this.localStat = fs.lstatSync(this.filepath);
            if (this.localStat == null || !(this.localStat.isFile() || localStat.isSymbolicLink())) {
                var msg = `${this.filepath} is not a file`;
                this.emit('error', msg);
                return;
            }
            this.result.attempt += 1;
            this.result.filesize = localStat.size;
            this.result.started = Date.now();
            this._upload();
        } catch (ex) {
            log.error(typeof ex);
            log.error(ex);
            this.emit('complete', false, ex);
        }
    }

    download() {

    }

    list() {
        var s3Client = this.getClient();
        var stream = s3Client.listObjects(this.storageService.bucket, '', false);
        stream.on('data', function(obj) { console.log(obj) } )
        stream.on('error', function(err) { console.log("Error: " + err) } )
    }

    /**
     * Checks to see whether a file already exists on the storage provider.
     *
     * @param {string} filepath - Basename of the file to check.
     *
     * @returns {bool} - True if the file exists.
     */
    exists(filepath) {
        try {
            // TODO: Write me
        } catch (ex) {
            // TODO: Write me
        }
        return trueOrFalse;
    }


    _upload() {
        var host = this.storageService.host;
        var bucket = this.storageService.bucket;
        var objectName = path.basename(this.filepath);
        this.emit('start', `Uploading ${this.filepath} to ${host} ${bucket}/${objectName}`)
        var uploader = this;
        var s3Client = uploader._getClient();

        s3Client.fPutObject(bucket, objectName, this.filepath, function(err) {
            if (err) {
                uploader._handleError(err);
                return;
            }
            // Note: Buckets must allow GetObject or you'll get
            // "valid credentials required" error from remote.
            s3Client.statObject(bucket, objectName, uploader._verifyRemote);
        });
    }

    _verifyRemote(err, remoteStat) {
        this.result.completed = Date.now();
        if (err) {
            this.result.errors.push(`After upload, could not get object stats. ${err.toString()}`);
            this.result.succeeded = false;
        }
        if (!err && remoteStat.size != this.localStat.size) {
            this.result.errors.push(`Object was not correctly uploaded. Local size is ${this.localStat.size}, remote size is ${remoteStat.size}`);
            this.result.succeeded = false;
        } else {
            this.result.remoteUrl = this._getRemoteUrl()
            this.result.remoteChecksum = remoteStat.etag;
            this.result.succeeded = true;
        }
        this.emit('finish', this.result);
    }

    _handleError(err) {
        if (this.result.attempt < MAX_ATTEMPTS) {
            // ECONNRESET: Connection reset by peer is common on large uploads.
            // Minio client is smart enough to pick up where it left off.
            // Log a warning, wait 5 seconds, then try again.
            uploader.emit('warning', `Got error ${err} on attempt number ${this.result.attempt}. Will try again in five seconds.`);
            setTimeout(function() { uploader._upload(this.filepath) }, 5000);
        } else {
            this.result.completed = Date.now();
            this.result.succeeded = false;
            this.result.errors.push(err.toString());
            uploader.emit('finish', this.result);
        }
    }

    _getRemoteUrl() {
        let url = 'https://' + this.storageService.host.replace('/','');
        let objectName = path.basename(this.filepath);
        if (this.storageService.port) {
            url += `:${port}`;
        }
        url += `/${this.storageService.bucket}/${objectName}`;
        return url;
    }

    _getClient() {
        var s3Client = new Minio.Client({
            endPoint:  this.storageService.host,
            accessKey: this.storageService.loginName,
            secretKey: this.storageService.loginPassword
        });
        // TODO: This is too specialized to go in a general-use client.
        // Where should this go?
        if (this.storageService.host == 's3.amazonaws.com' && this.storageService.bucket.startsWith('aptrust.')) {
            s3Client.region = 'us-east-1';
        }
        if (this.storageService.port == parseInt(this.storageService.port, 10)) {
            s3Client.port = port;
        }
        return s3Client;
    }

}
