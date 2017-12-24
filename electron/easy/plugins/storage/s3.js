const path = require('path');
const OperationResult = require(path.resolve('electron/easy/core/operation_result'));
const Minio = require('minio')

const name = "APTrust S3 uploader";
const description = "Uploads files to any service that supports the S3 API.";
const version = "0.1";
const protocol = "s3";

class S3 {

    /**
     * Custom storage provider.
     * @constructor
     * @param {object} job - A job object.
     * @param {object} storageService - A storage service object describing
     * the service protocol, credentials, URL, and other info.
     * See easy/storage_service.js.
     * @param {object} emitter - An Node event object that can emit events
     * @returns {object} - A new custom storage provider.
     */
    constructor(job, storageService, emitter) {
        this.job = job;
        this.storageService = storageService;
        this.emitter = emitter;
        // ... code ...
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
        var result = new OperationResult();
        var uploader = this;
        try {
            // ... code ...
            // Can emit events: 'start', 'complete', 'uploadStart',
            // 'uploadProgress', 'uploadComplete', 'warning', 'error'
            var operationName = "storage:" + uploader.result.storageService.name
            var result = uploader.job.findResult(operationName);
            if (result == null) {
                result = new OperationResult(operationName);
                uploader.job.operationResults.push(result);
            }
            result.reset();
            result.attemptNumber += 1;
            result.started = (new Date()).toJSON();

            var localStat = fs.lstatSync(filepath);
            if (localStat == null || !(localStat.isFile() || localStat.isSymbolicLink())) {
                var msg = `${filepath} is not a file`;
                uploader.emitter.emit('error', msg);
                result.succeeded = false;
                result.error = msg;
                result.completed = (new Date()).toJSON();
                uploader.job.save(); // save job with new OperationResult
                return;
            }

            var host = uploader.storageService.host;
            var bucket = uploader.storageService.bucket;
            var objectName = path.basename(filepath);

            uploader.emitter.emit('start', `Connecting to ${host}`)

            var s3Client = new Minio.Client({
                endPoint:  uploader.storageService.host,
                accessKey: uploader.storageService.loginName,
                secretKey: uploader.storageService.loginPassword
            })
            if (uploader.storageService.port == parseInt(uploader.storageService.port, 10)) {
                s3Client.port = port;
            }
            uploader.emitter.emit('uploadStart', `Uploading ${filepath} to ${host} ${bucket}/${objectName}`)
            s3Client.fPutObject(bucket, objectName, filepath, function(err) {
                if (err) {
                    uploader.emitter.emit('error', err);
                    uploader.emitter.emit('complete', "Upload failed with error. " + err);
                    result.succeeded = false;
                    result.error = err;
                    result.completed = (new Date()).toJSON();
                    uploader.job.save();
                    return;
                }
                uploader.emitter.emit('uploadComplete', `Finished uploading ${objectName}`)
                s3Client.statObject(bucket, objectName, function(err, remoteStat){
                    if (err) {
                        uploader.emitter.emit('error', err);
                        uploader.emitter.emit('complete', "After upload, could not get object stats. " + err);
                        result.succeeded = false;
                        result.error = err;
                        result.completed = (new Date()).toJSON();
                        uploader.job.save();
                        return;
                    }
                    if (remoteStat.size != localStat.size) {
                        var msg = `Object was not correctly uploaded. Local size is ${localStat.size}, remote size is ${remoteStat.size}`;
                        uploader.emitter.emit('error', msg);
                        uploader.emitter.emit('complete', msg);
                        result.succeeded = false;
                        result.error = msg;
                        result.completed = (new Date()).toJSON();
                        uploader.job.save();
                        return;
                    } else {
                        var msg = `Object uploaded successfully. Size: ${remoteStat.size}, ETag: ${remoteStat.etag}`;
                        result.succeeded = true;
                        result.error = msg;
                        result.completed = (new Date()).toJSON();
                        uploader.job.save();
                        uploader.emitter.emit('uploadComplete', msg);
                        uploader.emitter.emit('complete', msg);
                    }
                });
            })
        } catch (ex) {
           // ... code ...
            uploader.emitter.emit('error', msg);
            uploader.emitter.emit('complete', msg);
            result.succeeded = false;
            result.error = ex;
            result.completed = (new Date()).toJSON();
            uploader.job.save();
        }
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
