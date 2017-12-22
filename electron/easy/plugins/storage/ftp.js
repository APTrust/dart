const path = require('path');
const OperationResult = require(path.resolve('electron/easy/core/operation_result'));

const name = "FTP uploader";
const description = "Uploads files to an FTP server.";
const version = "0.1";
const protocol = "ftp";

class FTP {

    /**
     * Custom storage provider.
     * @constructor
     * @param {object} storageService - A storage service object describing
     * the service protocol, credentials, URL, and other info.
     * See easy/storage_service.js.
     * @returns {object} - A new custom storage provider.
     */
    constructor(storageService) {
        this.storageService = storageService;
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
     * @returns {object} - An instance of OperationResult.
     * See easy/operation_result.js.
     */
    upload(filepath) {
        var result = new OperationResult();
        try {
            // ... code ...
        } catch (ex) {
           // ... code ...
        }
        return result;
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

module.exports.Provider = FTP;
module.exports.name = name;
module.exports.description = description;
module.exports.version = version;
module.exports.protocol = protocol;
