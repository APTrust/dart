/**
 * ValidationOperation contains information describing which bag to validate
 * and which BagItProfile to use when validating it.
 *
 */
class ValidationOperation {
    /**
     * Creates a new ValidationOperation.
     *
     * @param {string} pathToBag - The absolute path to the bag DART should
     * validate.
     *
     * @param {string} bagItProfileIdOrPath - The ID of or path to the
     * BagItProfile DART should use when validating this bag.
     *
     */
    constructor(pathToBag, bagItProfileIdOrPath) {
        /**
         * The absolute path to the bag to validate. The path can point to a
         * file or directory.
         *
         * @type {string}
         */
        this.pathToBag = pathToBag;
        /**
         * The id of the BagItProfile that DART should use to validate the
         * bag. This should be a UUID that BagItProfile.find() can look up
         * in the local data store. Or it should be an absolute path to a
         * BagItProfile json file that DART can read from the file system.
         *
         * @type {string}
         */
        this.bagItProfileIdOrPath = null;
        /**
         * This describes the result of DART's attempt to validate the bag.
         *
         * @type {OperationResult}
         */
        this.result = null;
    }
}

module.exports.ValidationOperation = ValidationOperation;
