const { Context } = require('../../core/context');
const fs = require('fs');
const Minio = require('minio');
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
        var xfer = this._initXferRecord('upload', filepath, keyname);
        try {
            if (xfer.localStat == null || !(xfer.localStat.isFile() || xfer.localStat.isSymbolicLink())) {
                var msg = `${filepath} is not a file`;
                this.emit('error', msg);
                return;
            }
            this._upload(xfer);
        } catch (ex) {
            xfer.result.finish(false, ex.toString());
            this.emit('finish', xfer);
        }
    }

    download(filepath, keyname) {
        var s3Client = this;
        var minioClient = s3Client._getClient();
        var xfer = this._initXferRecord('download', filepath, keyname);
        this.emit('start', `Downloading ${xfer.host} ${xfer.bucket}/${xfer.key} to ${xfer.localPath}`)
        minioClient.fGetObject(xfer.bucket, xfer.key, xfer.localPath, function(err) {
            if (err) {
                s3Client.emit('error', err.toString());
                xfer.result.finish(false, err.toString());
            } else {
                xfer.localStat = fs.statSync(filepath);
                xfer.result.filesize = xfer.localStat.size;
                xfer.result.finish(true);
            }
            s3Client.emit('finish', xfer.result);
        });
    }

    list() {
        var minioClient = this.getClient();
        var stream = minioClient.listObjects(this.storageService.bucket, '', false);
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

    _initXferRecord(operation, filepath, keyname) {
        var xfer = new S3Transfer(operation, S3Client.description().name);
        xfer.host = this.storageService.host;
        xfer.port = this.storageService.port;
        xfer.localPath = filepath;
        xfer.bucket = this.storageService.bucket;
        xfer.key = keyname;
        xfer.result.start();
        if (operation === 'upload') {
            xfer.localStat = fs.lstatSync(filepath);
            xfer.result.filesize = xfer.localStat.size;
        }
        if (operation === 'download') {
            xfer.result.remoteURL = xfer.getRemoteUrl();
        }
        return xfer;
    }

    _upload(xfer) {
        var s3Client = this;
        var minioClient = s3Client._getClient();
        var metadata = {
            'Uploaded-By': `${Context.dartVersion()}`,
            'Original-Path': xfer.localPath,
            'Size': xfer.localStat.size
        };
        this.emit('start', `Uploading ${xfer.localPath} to ${xfer.host} ${xfer.bucket}/${xfer.key}`)
        try {
            minioClient.fPutObject(xfer.bucket, xfer.key, xfer.localPath, metadata, function(err, etag) {
                if (err) {
                    s3Client._handleError(err, xfer);
                    return;
                }
                // Note: Buckets must allow GetObject or you'll get
                // "valid credentials required" error from remote.
                xfer.remoteChecksum = etag;
                minioClient.statObject(xfer.bucket, xfer.key, function(err, remoteStat) {
                    // TODO: Refactor duplicate code...
                    if (err) {
                        xfer.result.finish(false, err.toString());
                        s3Client.emit('finish', xfer.result);
                        return;
                    }
                    xfer.remoteStat = remoteStat;
                    s3Client._verifyRemote(xfer);
                });
            });
        } catch (ex) {
            xfer.result.finish(false, ex.toString());
            s3Client.emit('finish', xfer.result);
        }
    }

    _verifyRemote(xfer) {
        var succeeded = false;
        var message;
        if (xfer.error) {
            message = `After upload, could not get object stats. ${xfer.error.toString()}`;
        }
        if (!xfer.error && xfer.remoteStat.size != xfer.localStat.size) {
            message = `Object was not correctly uploaded. Local size is ${xfer.localStat.size}, remote size is ${xfer.remoteStat.size}`;
        } else {
            xfer.result.remoteURL = xfer.getRemoteUrl();
            xfer.result.remoteChecksum = xfer.remoteStat.etag;
            succeeded = true;
        }
        xfer.result.finish(succeeded, message);
        this.emit('finish', xfer.result);
    }

    _handleError(err, xfer) {
        var s3Client = this;
        if (xfer.result.attempt < MAX_ATTEMPTS) {
            // ECONNRESET: Connection reset by peer is common on large uploads.
            // Minio client is smart enough to pick up where it left off.
            // Log a warning, wait 5 seconds, then try again.
            this.emit('warning', `Got error ${err.code} (request id ${err.requestid}) on attempt number ${xfer.result.attempt}. Will try again in 1.5 seconds.`);
            setTimeout(function() { s3Client._upload(xfer) }, 1500);
        } else {
            xfer.result.finish(false, err.toString());
            this.emit('finish', xfer.result);
        }
    }

    _getClient() {
        var minioClient = new Minio.Client({
            endPoint:  this.storageService.host,
            port: this.storageService.port || 443,
            accessKey: this.storageService.login,
            secretKey: this.storageService.password
        });
        // TODO: This is too specialized to go in a general-use client.
        // Where should this go?
        if (this.storageService.host == 's3.amazonaws.com' && this.storageService.bucket.startsWith('aptrust.')) {
            minioClient.region = 'us-east-1';
        }
        return minioClient;
    }

}
