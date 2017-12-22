# Easy Store Plugins

Easy Store supports plugins for custom packaging and storage modules.
Packaging plugins provide support for packaging files into BagIt and other
custom formats. Example future formats may include zip, rar, parchive, etc.
Storage plugins provide support for storing files either locally or (more
commonly) across a network. The initial storage plugin will provide S3 storage.
Future plugins may provide SFTP, rsync, or virtually any other protocol.

# Plugin Interfaces

Plugins must support a simple, consistent interface so that they are
interchangeable at runtime. The interfaces are described below.

## Packaging Plugin

Packaging plugins must export a class that implements the methods shown
below. The plugin must also export string fields called Format and
FormatMimeType that describe what packaging format the plugin provides.
Formats should be file extensions without the leading dot. For example,
"tar", "zip", "parchive", etc. FormatMimeType should be the corresponding
mime type for the file extension. For example, "application/x-tar",
"application/zip", "application/x-par2".

```javascript

const path = require('path');
const JobResult = require(path.resolve('electron/easy/job_result'));

const format = "<file ext>";
const formatMimeType = "<mime type>";

class <YourClassName> {

    /**
     * Custom packager.
     * @constructor
     * @param {object} job - The job object. See easy/job.js.
     * @returns {object} - A new custom packager.
     */
    constructor(job) {
        this.job = job;
        // ... code ...
    }

    /**
     * Assembles all job.files into a package (e.g. a zip file,
     * tar file, rar file, etc.).
     * @returns {object} - An instance of JobResult. See easy/job_result.js.
     */
    package() {
        var result = new JobResult();
        try {
            // ... code ...
        } catch (ex) {
            // ... code ...
        }
        return result;
    }
}

module.exports.<YourClassName> = <YourClassName>;
module.exports.format = format;
module.exports.formatMimeType = formatMimeType;

```

## Storage Plugin

Storage plugins must export a class that implements the methods shown
below. The plugin must also export a string fields called Protocol,
which describes the protocol that the plugin provides. E.g. "ftp",
"sftp", "s3", "rsync", "scp", etc.


```javascript

const path = require('path');
const UploadResult = require(path.resolve('electron/easy/upload_result'));

const protocol = "<protocol>";

class <YourClassName> {

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
     * Uploads a file to the storage provider. Note that because StorageService
     * includes a bucket property, the file will be uploaded into that
     * bucket/folder on the remote provider. So if StorageService.bucket is
     * 'mybucket/private', and filepath is '/home/josie/photo.jpg', the upload
     * function will create the file 'mybucket/private/photo.jpg' on the remote
     * storage provider.
     * @param {string} filepath - Absolute path to the file to be uploaded.
     * @returns {object} - An instance of UploadResult. See easy/upload_result.js.
     */
    upload(filepath) {
        var result = new UploadResult();
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

module.exports.<YourClassName> = <YourClassName>;
module.exports.protocol = protocol;

```
