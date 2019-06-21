const { Context } = require('../../core/context');
const fs = require('fs');
const Minio = require('minio');
const { Plugin } = require('../plugin');
const { S3Transfer } = require('./s3_transfer');

const MAX_ATTEMPTS = 10;

/**
 * This is a subset of the list of S3 errors at
 * https://docs.aws.amazon.com/AmazonS3/latest/API/ErrorResponses.html#ErrorCodeList.
 *
 * These errors apply to PUT/POST requests (uploads) and should be
 * considered fatal, causing the S3Client to stop attempting the
 * current upload job.
 *
 * While the S3Client does retry on transient network errors, it will
 * not retry on fatal errors that will be just as fatal in the next
 * attempt. For example, an InvalidAccessKeyId error indicates that
 * we're using bad credentials and we should not retry with the same
 * bad credentials.
 */
const FATAL_UPLOAD_ERRORS = [
    'AccessDenied',
    'AccountProblem',
    'AllAccessDisabled',
    'EntityTooSmall',
    'EntityTooLarge',
    'InvalidAccessKeyId',
    'InvalidArgument',
    'InvalidBucketName',
    'InvalidEncryptionAlgorithmError',
    'InvalidLocationConstraint',
    'InvalidObjectState',
    'InvalidPayer',
    'InvalidSecurity',
    'InvalidStorageClass',
    'InvalidURI',
    'KeyTooLongError',
    'MaxMessageLengthExceeded',
    'MaxPostPreDataLengthExceededError',
    'MetadataTooLarge',
    'MethodNotAllowed',
    'NoSuchBucket',
    'NotImplemented',
    'NotSignedUp',
    'PreconditionFailed'
];

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
        this._statusInterval = null;
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
            throw new Error('Param filepath is required for upload.');
        }
        if (!keyname) {
            keyname = path.basename(filepath);
        }
        var xfer = this._initXferRecord('upload', filepath, keyname);
        try {
            if (xfer.localStat == null || !(xfer.localStat.isFile() || xfer.localStat.isSymbolicLink())) {
                xfer.result.finish(Context.y18n.__('%s is not a file', filepath));
                this.emit('error', xfer.result);
                clearInterval(this._statusInterval);
                return;
            }
            Context.logger.info(Context.y18n.__('Starting upload'));
            let minioClient = this._upload(xfer);
            let client = this;
            this._statusInterval = setInterval(() => {
                client._getUploadProgress(minioClient, xfer)
            }, 800);
        } catch (err) {
            xfer.result.finish(err.toString());
            this.emit('error', xfer.result);
            clearInterval(this._statusInterval);
        }
        // --------------------------------------------------------------
        // TODO: Progress bar. See https://trello.com/c/GkXdln8N
        //
        // As long as xfer.result.completed == null, check periodically
        // to get the size the parts uploaded so far. We would do this
        // only on large files (> 20 GB or 50GB) that take a long time
        // to upload. For those, call Minio's listIncompleteUploads()
        // function with the exact bucket name and object key name being
        // uploaded. That returns a readable stream whose data event
        // should emit one object (because the bucket/key name is unique)
        // with a .size attribute.
        //
        // Check listIncompleteUploads() every 1-5 minutes, based on the
        // size of the file being sent. Stop when xfer.result.completed
        // is no longer null. Display something like this to the user:
        //
        // Uploaded 29.8 GB of 387 GB as of 3:15:22 PM (2.5 MB / minute)
        //
        // --------------------------------------------------------------
    }

    _getUploadProgress(minioClient, xfer) {
        let client = this;
        let fileSize = xfer.localStat.size;
        let _stream = minioClient.listIncompleteUploads(xfer.bucket, xfer.key, false);
        _stream.on('data', function(part) {
            xfer.bytesTransferred = part.size;
            xfer.percentComplete = (part.size / fileSize) * 100;
            Console.logger.info(
                'Uploaded %s bytes of %s. %s percent complete',
                part.size, xfer.key, xfer.percentComplete
            );
            client.emit('status', xfer);
        })
        // _stream.on('end', function() {
        //     console.log('End')
        // })
        // _stream.on('error', function(err) {
        //     console.log(err)
        // })
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
                xfer.result.finish(err.toString());
                s3Client.emit('error', xfer.result);
                xfer.result.finish(err.toString());
                return;
            } else {
                xfer.localStat = fs.statSync(filepath);
                xfer.result.filesize = xfer.localStat.size;
                xfer.result.finish();
            }
            Context.logger.info(Context.y18n.__('Finished download'));
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
            xfer.result.filepath = filepath;
            xfer.result.fileMtime = xfer.localStat.mtime;
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
     * @returns {Minio.Client}
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
                        Context.logger.error('Error getting object info after upload: %s', err.toString());
                        xfer.result.finish(err.toString());
                        s3Client.emit('error', xfer.result);
                        return;
                    }
                    xfer.remoteStat = remoteStat;
                    s3Client._verifyRemote(xfer);
                });
            });
        } catch (err) {
            Context.logger.error('Upload error: %s', err.toString());
            xfer.result.finish(err.toString());
            s3Client.emit('error', xfer.result);
        }
        return minioClient;
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
        var message = null;
        if (xfer.error) {
            message = `After upload, could not get object stats. ${xfer.error.toString()}`;
        }
        if (!xfer.error && xfer.remoteStat.size != xfer.localStat.size) {
            message = `Object was not correctly uploaded. Local size is ${xfer.localStat.size}, remote size is ${xfer.remoteStat.size}`;
        } else {
            xfer.result.remoteURL = xfer.getRemoteUrl();
            xfer.result.remoteChecksum = xfer.remoteStat.etag;
        }
        xfer.result.finish(message);
        Context.logger.info(Context.y18n.__('Finished upload'));
        clearInterval(this._statusInterval);
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
        if (xfer.result.attempt < MAX_ATTEMPTS && !FATAL_UPLOAD_ERRORS.includes(err.code)) {
            // ECONNRESET: Connection reset by peer is common on large uploads.
            // Minio client is smart enough to pick up where it left off.
            // Log a warning, wait 5 seconds, then try again.
            xfer.result.warning = `Got error ${err.code} (request id ${err.requestid}) on attempt number ${xfer.result.attempt} while attempting to send ${xfer.result.filepath} to ${this.storageService.host}. Will try again in 1.5 seconds.`;
            this.emit('warning', xfer.result);
            let s3Client = this;
            setTimeout(function() {
                xfer.result.attempt += 1;
                Context.logger.info('Reattempting upload');
                s3Client._upload(xfer);
            }, 1500);
        } else {
            Context.logger.error('Too many failed upload attempts');
            xfer.result.finish(err.toString());
            clearInterval(this._statusInterval);
            this.emit('error', xfer.result);
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
            accessKey: this.storageService.getValue('login'),
            secretKey: this.storageService.getValue('password')
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
