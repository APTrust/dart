const path = require('path');
const OperationResult = require(path.resolve('electron/easy/core/operation_result'));

const name = "APTrust Tar Provider";
const description = "Packages files into a single tar file."
const version = "0.1";
const format = "tar";
const formatMimeType = "application/x-tar";

class Tar {

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

module.exports.Provider = Tar;
module.exports.name = name;
module.exports.description = description;
module.exports.version = version;
module.exports.format = format;
module.exports.formatMimeType = formatMimeType;
