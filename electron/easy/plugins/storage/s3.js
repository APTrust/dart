const path = require('path');
const fs = require('fs');
const { OperationResult } = require('../../core/operation_result');
const Minio = require('minio')

const name = "APTrust S3 uploader";
const description = "Uploads files to any service that supports the S3 API.";
const version = "0.1";
const protocol = "s3";

const MAX_ATTEMPTS = 8;

class S3 {

    /**
     * Custom storage provider.
     * @constructor
     * @param {object} storageService - A storage service object describing
     * the service protocol, credentials, URL, and other info.
     * See easy/storage_service.js.
     * @param {object} emitter - An Node event object that can emit events
     * @returns {object} - A new custom storage provider.
     */
    constructor(storageService, emitter) {
        this.storageService = storageService;
        this.emitter = emitter;
        this.attemptNumber = 0;
    }

    /**
     * Returns a map with descriptive info about this provider.
     * @returns {object} - Contains descriptive info about this provider.
     */
     describe() {
         return { name: name,
                  description: description,
                  version: version,
                  protocol: protocol
                };
     }

    /**
     * Uploads a file to the storage provider. Note that because StorageService
     * includes a bucket property, the file will be uploaded into that
     * bucket/folder on the remote provider. So if StorageService.bucket is
     * 'mybucket/private', and filepath is '/home/josie/photo.jpg', the upload
     * function will create the file 'mybucket/private/photo.jpg' on the remote
     * storage provider.
     * @param {string} filepath - Absolute path to the file to be uploaded.
     */
    upload(filepath) {
        var started = false;
        var fileCount = 0;
        var uploader = this;
        this.attemptNumber += 1;
        try {
            // Can emit events: 'start', 'complete', 'uploadStart',
            // 'uploadProgress', 'uploadComplete', 'warning', 'error'
            var localStat = fs.lstatSync(filepath);
            if (localStat == null || !(localStat.isFile() || localStat.isSymbolicLink())) {
                var msg = `${filepath} is not a file`;
                uploader.emitter.emit('error', msg);
                return;
            }

            var host = uploader.storageService.host;
            var bucket = uploader.storageService.bucket;
            var objectName = path.basename(filepath);

            uploader.emitter.emit('start', `Connecting to ${host}`)

            var s3Client = uploader.getClient();
            uploader.emitter.emit('uploadStart', `Uploading ${filepath} to ${host} ${bucket}/${objectName}`)
            s3Client.fPutObject(bucket, objectName, filepath, function(err) {
                if (err) {
                    if (uploader.attemptNumber < MAX_ATTEMPTS) {
                        // ECONNRESET: Connection reset by peer is common on large uploads.
                        // Minio client is smart enough to pick up where it left off.
                        // Log a warning, wait 5 seconds, then try again.
                        uploader.emitter.emit('warning', `Got error ${err}. Will attempt to resume upload in five seconds.`)
                        setTimeout(uploader.upload, 5000);
                    } else {
                        // Too many attempts.
                        uploader.emitter.emit('complete', false, "Upload failed after ${uploader.attemptNumber} attempts. Last error: ${err}");
                    }
                    return;
                }
                // Note PT #153962363: Buckets must allow GetObject or you'll
                // get "valid credentials required" error.
                s3Client.statObject(bucket, objectName, function(err, remoteStat){
                    if (err) {
                        uploader.emitter.emit('complete', false, "After upload, could not get object stats. " + err);
                        return;
                    }
                    if (remoteStat.size != localStat.size) {
                        var msg = `Object was not correctly uploaded. Local size is ${localStat.size}, remote size is ${remoteStat.size}`;
                        uploader.emitter.emit('complete', false, msg);
                        return;
                    } else {
                        uploader.emitter.emit('uploadComplete', true, `Saved ${objectName} in ${bucket}.`);
                        uploader.emitter.emit('complete', true, `Object uploaded successfully. Size: ${remoteStat.size}, ETag: ${remoteStat.etag}`);
                    }
                });
            })
        } catch (ex) {
           // ... code ...
            console.log(typeof ex);
            console.log(ex);
            uploader.emitter.emit('complete', false, ex);
        }
    }

    list(bucket) {
        var s3Client = this.getClient();
        var stream = s3Client.listObjects(bucket, '', false);
        stream.on('data', function(obj) { console.log(obj) } )
        stream.on('error', function(err) { console.log("Error: " + err) } )
    }

    getClient() {
        var s3Client = new Minio.Client({
            endPoint:  this.storageService.host,
            accessKey: this.storageService.loginName,
            secretKey: this.storageService.loginPassword
        });
        if (this.storageService.host == 's3.amazonaws.com' && this.storageService.bucket.startsWith('aptrust.')) {
            s3Client.region = 'us-east-1';
        }
        if (this.storageService.port == parseInt(this.storageService.port, 10)) {
            s3Client.port = port;
        }
        return s3Client;
    }

    /**
     * Checks to see whether a file already exists on the storage provider.
     * @param {string} filepath - Basename of the file to check.
     * @returns {bool} - True if the file exists.
     */
    exists(filepath) {
        try {
            // ... code ...
        } catch (ex) {
           // ... code ...
        }
        return trueOrFalse;
    }
}

module.exports.Provider = S3;
module.exports.name = name;
module.exports.description = description;
module.exports.version = version;
module.exports.protocol = protocol;
