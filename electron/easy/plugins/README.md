# DART Plugins

DART supports plugins for custom packaging and storage modules.
Packaging plugins provide support for packaging files into BagIt and other
custom formats. Example future formats may include zip, rar, parchive, etc.
Storage plugins provide support for storing files either locally or (more
commonly) across a network. The initial storage plugin will provide S3 storage.
Future plugins may provide SFTP, rsync, or virtually any other protocol.

# Plugin Interfaces

Plugins must support a simple, consistent interface so that they are
interchangeable at runtime. The interfaces are described below.

`NOTE: The plugin interface is likely to change until we reach our first public release.`

## Packaging Plugin

Packaging plugins must export a field called 'Provider', which is the
class that implements the methods shown below. The plugin must also export
string fields called Format and FormatMimeType that describe what packaging
format the plugin provides. It should also exportname, description, and
version strings.

Formats should be file extensions without the leading dot. For example,
"tar", "zip", "parchive", etc. FormatMimeType should be the corresponding
mime type for the file extension. For example, "application/x-tar",
"application/zip", "application/x-par2".


```javascript

const path = require('path');
const OperationResult = require(path.resolve('electron/easy/core/operation_result'));

const name = "<name of package>";
const description = "<package description>";
const version = "<version>";
const format = "<file ext>";
const formatMimeType = "<mime type>";

class <YourClassName> {

    /**
     * Custom packager.
     * @constructor
     * @param {object} job - The job object. See easy/job.js.
     * @param {object} emitter - An Node event object that can emit events
     * @returns {object} - A new custom packager.
     */
    constructor(job, emitter) {
        this.job = job;
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
                  format: format,
                  formatMimeType: formatMimeType
                };
     }


    /**
     * Assembles all job.files into a package (e.g. a zip file,
     * tar file, rar file, etc.).
     */
    packageFiles() {
        var result = new OperationResult();
        try {
            // ... code ...
            // Can emit events: 'start', 'complete', 'fileAddStart',
            // 'fileProgress', 'fileAddComplete', 'packageStart', 'packageComplete',
            // 'validateStart', 'validateComplete', 'warning', 'error'
        } catch (ex) {
            // ... code ...
        }
    }
}

module.exports.Provider = <YourClassName>;
module.exports.name = name;
module.exports.description = description;
module.exports.version = version;
module.exports.format = format;
module.exports.formatMimeType = formatMimeType;

```

## Storage Plugin

Storage plugins must export a field called 'Provider', which is the
class that implements the methods shown below. It should also export
name, description, and version strings.

The plugin must also export a string fields called Protocol,
which describes the protocol that the plugin provides. E.g. "ftp",
"sftp", "s3", "rsync", "scp", etc.


```javascript

const path = require('path');
const OperationResult = require(path.resolve('electron/easy/core/operation_result'));

const name = "<name of package>";
const description = "<package description>";
const version = "<version>";
const protocol = "<protocol>";

class <YourClassName> {

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
        var result = new OperationResult();
        try {
            // ... code ...
            // Can emit events: 'start', 'complete', 'uploadStart',
            // 'uploadProgress', 'uploadComplete', 'warning', 'error'
        } catch (ex) {
           // ... code ...
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

module.exports.Provider = <YourClassName>;
module.exports.name = name;
module.exports.description = description;
module.exports.version = version;
module.exports.protocol = protocol;

```
