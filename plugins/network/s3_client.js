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
 */
class S3Client extends Plugin {
    /**
     * Creates a new S3Client.
     *
     * @param {StorageService} storageService - A StorageService record that
     * includes information about how to connect to a remote S3 service.
     * This record includes the host URL, default bucket, and connection
     * credentials.
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
                xfer.result.errors.push(`${filepath} is not a file`);
                this.emit('error', xfer.result);
                return;
            }
            this._upload(xfer);
        } catch (err) {
            xfer.result.finish(false, err.toString());
            this.emit('finish', xfer.result);
        }
    }

    /**
     * Downloads a file fron the remote bucket. The name of the remote bucket is
     * determined by the {@link StorageService} passed in to this class'
     * constructor.
     *
     * @param {string} filepath - The local path to which we should save the
     * downloaded file.
     *
     * @param {string} keyname - This name of the key (object) to download from
     * the S3 bucket.
     *
     * @returns
     */
    download(filepath, keyname) {
        var s3Client = this;
        var minioClient = s3Client._getClient();
        var xfer = this._initXferRecord('download', filepath, keyname);
        xfer.result.info = `Downloading ${xfer.host} ${xfer.bucket}/${xfer.key} to ${xfer.localPath}`;
        this.emit('start', xfer.result);
        // TODO: Build in retries?
        minioClient.fGetObject(xfer.bucket, xfer.key, xfer.localPath, function(err) {
            if (err) {
                xfer.result.errors.push(err.toString());
                s3Client.emit('error', xfer.result);
                xfer.result.finish(false, err.toString());
            } else {
                xfer.localStat = fs.statSync(filepath);
                xfer.result.filesize = xfer.localStat.size;
                xfer.result.finish(true);
            }
            s3Client.emit('finish', xfer.result);
        });
    }

    /**
     * Lists files in a remote S3 bucket. NOT YET IMPLEMENTED.
     *
     */
    list() {
        throw 'S3Client.list() is not yet implemented.';
        // var minioClient = this.getClient();
        // var stream = minioClient.listObjects(this.storageService.bucket, '', false);
        // stream.on('data', function(obj) { console.log(obj) } )
        // stream.on('error', function(err) { console.log("Error: " + err) } )
    }

    /**
     * Checks to see whether a file already exists on the storage provider.
     * NOT YET IMPLEMENTED.
     *
     * @param {string} key - The key whose existence you want to check.
     *
     * @returns {bool} - True if the file exists.
     */
    exists(key) {
        throw 'S3Client.exists() is not yet implemented.';
        try {
            // TODO: Write me
        } catch (err) {
            // TODO: Write me
        }
        return trueOrFalse;
    }

    /**
     * Creates the S3Transfer record used internally by this client
     * to record details of an S3 upload or download.
     *
     * @param {string} operation - Should be 'upload' or 'download'.
     *
     * @param {string} filepath - Path of the file on the local file system
     * to upload (if operation is uplaod). Path on the local file system where
     * we should write the contents of the S3 object we download (if operation
     * is download).
     *
     * @param {string} key - The S3 key to upload or download.
     *
     * @private
     * @returns {S3Transfer}
     */
    _initXferRecord(operation, filepath, key) {
        var xfer = new S3Transfer(operation, S3Client.description().name);
        xfer.host = this.storageService.host;
        xfer.port = this.storageService.port;
        xfer.localPath = filepath;
        xfer.bucket = this.storageService.bucket;
        xfer.key = key;
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

    /**
     * Uploads a file to S3.
     *
     * @param {S3Transfer} xfer - An object describing what to upload
     * and where it should go.
     *
     * @private
     */
    _upload(xfer) {
        var s3Client = this;
        var minioClient = s3Client._getClient();
        var metadata = {
            'Uploaded-By': `${Context.dartVersion()}`,
            'Original-Path': xfer.localPath,
            'Size': xfer.localStat.size
        };
        xfer.result.info = `Uploading ${xfer.localPath} to ${xfer.host} ${xfer.bucket}/${xfer.key}`;
        this.emit('start', xfer.result)
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
                    if (err) {
                        xfer.result.finish(false, err.toString());
                        s3Client.emit('finish', xfer.result);
                        return;
                    }
                    xfer.remoteStat = remoteStat;
                    s3Client._verifyRemote(xfer);
                });
            });
        } catch (err) {
            xfer.result.finish(false, err.toString());
            s3Client.emit('finish', xfer.result);
        }
    }

    /**
     * Ensures that the file we uploaded to S3 has the correct size
     * and that no errors occurred.
     *
     * @param {S3Transfer} xfer - An object describing what to upload
     * and where it should go.
     *
     * @private
     */
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

    /**
     * Handles an S3 upload error by either retrying or quitting and recording
     * the error message.
     *
     * @param {Error} err - An optional error object, caught during the upload
     * attempt.
     *
     * @param {S3Transfer} xfer - An object describing what to upload
     * and where it should go.
     *
     * @private
     */
    _handleError(err, xfer) {
        var s3Client = this;
        if (xfer.result.attempt < MAX_ATTEMPTS) {
            // ECONNRESET: Connection reset by peer is common on large uploads.
            // Minio client is smart enough to pick up where it left off.
            // Log a warning, wait 5 seconds, then try again.
            xfer.result.warning = `Got error ${err.code} (request id ${err.requestid}) on attempt number ${xfer.result.attempt}. Will try again in 1.5 seconds.`;
            this.emit('warning', xfer.result);
            setTimeout(function() { s3Client._upload(xfer) }, 1500);
        } else {
            xfer.result.finish(false, err.toString());
            this.emit('finish', xfer.result);
        }
    }

    /**
     * Returns a Minio S3 client.
     *
     * @private
     */
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

    /**
     * @event S3Client#start
     * @type {string} A message indicating that the upload or download is starting.
     *
     * @event S3Client#warning
     * @type {string} A warning message describing why the S3Client is retrying
     * an upload or download operation.
     *
     * @event S3Client#error
     * @type {OperationResult} Contains information about what went wrong during
     * an upload or download operation.
     *
     * @event S3Client#finish
     * @type {OperationResult} Contains information about the outcome of
     * an upload or download operation.
     */

}

// Use because declaring module.exports above cause jsdoc to screw up.
module.exports = S3Client;
