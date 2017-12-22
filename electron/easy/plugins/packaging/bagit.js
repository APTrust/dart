const path = require('path');
const OperationResult = require(path.resolve('electron/easy/operation_result'));

const format = "bagit";
const formatMimeType = "";

class BagIt {

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
     * @returns {object} - An instance of OperationResult.
     * See easy/operation_result.js.
     */
    package() {
        var result = new OperationResult();
        try {
            // ... code ...
        } catch (ex) {
            // ... code ...
        }
        return result;
    }
}

module.exports.Provider = BagIt;
module.exports.format = format;
module.exports.formatMimeType = formatMimeType;
