const fs = require('fs');
const { Plugin } = require('../plugin');
const { S3Transfer } = require('./s3_transfer');

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
    constructor(storageService) {
        super();
        this.storageService = storageService;
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

    /**
     * Uploads a file to the remote bucket. The name of the remote bucket is
     * determined by the {@link StorageService} passed in to this class'
     * constructor.
     *
     * @param {string} filepath - The path to the local file to be uploaded
     * to S3.
     *
     * @param {string} keyname - This name of the key to put into the remote
     * bucket. This parameter is optional. If not specified, it defaults to
     * the basename of filepath. That is, /path/to/bagOfPhotos.tar would
     * default to bagOfPhotos.tar.
     *
     * @returns
     */
    upload(filepath, keyname) {
        if (!filepath) {
            throw 'Param filepath is required for upload.';
        }
        if (!keyname) {
            keyname = path.basename(filepath);
        }
        try {
            var xfer = this._initUploadXfer(filepath, keyname);
            if (xfer.localStat == null || !(xfer.localStat.isFile() || xfer.localStat.isSymbolicLink())) {
                var msg = `${filepath} is not a file`;
                this.emit('error', msg);
                return;
            }
            this._upload(xfer);
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

    _initUploadXfer(filepath, keyname) {
        var xfer = new S3Transfer('upload', S3Client.description().name);
        xfer.localPath = filepath;
        xfer.bucket = this.storageService.bucket;
        xfer.key = keyname;
        xfer.result.attempt += 1;
        xfer.result.started = Date.now();
        xfer.localStat = fs.lstatSync(filepath);
        xfer.result.filesize = xfer.localStat.size;
        return xfer;
    }

    _upload(xfer) {
        var host = this.storageService.host;
        this.emit('start', `Uploading ${xfer.filepath} to ${host} ${xfer.bucket}/${xfer.key}`)
        var uploader = this;
        var s3Client = uploader._getClient();

        s3Client.fPutObject(xfer.bucket, xfer.key, xfer.filepath, function(err) {
            if (err) {
                uploader._handleError(err, xfer);
                return;
            }
            // Note: Buckets must allow GetObject or you'll get
            // "valid credentials required" error from remote.
            s3Client.statObject(xfer.bucket, xfer.key, function(err, remoteStat) {
                xfer.error = err;
                xfer.remoteState = remoteStat;
                uploader._verifyRemote(xfer);
            });
        });
    }

    _verifyRemote(xfer) {
        xfer.result.completed = Date.now();
        if (xfer.error) {
            xfer.result.errors.push(`After upload, could not get object stats. ${xfer.error.toString()}`);
            xfer.result.succeeded = false;
        }
        if (!xfer.error && xfer.remoteStat.size != xfer.localStat.size) {
            xfer.result.errors.push(`Object was not correctly uploaded. Local size is ${xfer.localStat.size}, remote size is ${xfer.remoteStat.size}`);
            xfer.result.succeeded = false;
        } else {
            xfer.result.remoteUrl = this._getRemoteUrl(xfer.key)
            xfer.result.remoteChecksum = remoteStat.etag;
            xfer.result.succeeded = true;
        }
        this.emit('finish', xfer.result);
    }

    _handleError(err, xfer) {
        if (xfer.result.attempt < MAX_ATTEMPTS) {
            // ECONNRESET: Connection reset by peer is common on large uploads.
            // Minio client is smart enough to pick up where it left off.
            // Log a warning, wait 5 seconds, then try again.
            this.emit('warning', `Got error ${err} on attempt number ${xfer.result.attempt}. Will try again in 1.5 seconds.`);
            setTimeout(function() { this._upload(xfer) }, 1500);
        } else {
            xfer.result.completed = Date.now();
            xfer.result.succeeded = false;
            xfer.result.errors.push(err.toString());
            this.emit('finish', xfer.result);
        }
    }

    _getRemoteUrl(key) {
        let url = 'https://' + this.storageService.host.replace('/','');
        if (this.storageService.port) {
            url += `:${port}`;
        }
        url += `/${this.storageService.bucket}/${key}`;
        return url;
    }

    _getClient() {
        var minioClient = new Minio.Client({
            endPoint:  this.storageService.host,
            accessKey: this.storageService.loginName,
            secretKey: this.storageService.loginPassword
        });
        // TODO: This is too specialized to go in a general-use client.
        // Where should this go?
        if (this.storageService.host == 's3.amazonaws.com' && this.storageService.bucket.startsWith('aptrust.')) {
            minioClient.region = 'us-east-1';
        }
        if (this.storageService.port === parseInt(this.storageService.port, 10)) {
            minioClient.port = port;
        }
        return minioClient;
    }

}
