const path = require('path');
const OperationResult = require(path.resolve('electron/easy/core/operation_result'));

const name = "APTrust BagIt Provider";
const description = "Provides access to the APTrust command-line bagging library."
const version = "0.1";
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
     * @returns {object} - An instance of OperationResult.
     * See easy/operation_result.js.
     */
    packageFiles() {
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
module.exports.name = name;
module.exports.description = description;
module.exports.version = version;
module.exports.format = format;
module.exports.formatMimeType = formatMimeType;
