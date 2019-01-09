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
     */
    constructor(pathToBag) {
        /**
         * The absolute path to the bag to validate. The path can point to a
         * file or directory.
         *
         * @type {string}
         */
        this.pathToBag = pathToBag;
        /**
         * This describes the result of DART's attempt to validate the bag.
         *
         * @type {OperationResult}
         */
        this.result = null;
        /**
         * Contains information describing validation errors. Key is the
         * name of the invalid field. Value is a description of why the
         * field is not valid.
         *
         * @type {Object<string, string>}
         */
        this.errors = {};
    }
}

module.exports.ValidationOperation = ValidationOperation;
