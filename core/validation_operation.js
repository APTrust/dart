const { Context } = require('./context');
const fs = require('fs');
const { OperationResult } = require('./operation_result');
const { Util } = require('./util');

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

    /**
     * validate returns true or false, indicating whether this object
     * contains complete and valid data. If it returns false, check
     * the errors property for specific errors.
     *
     * @returns {boolean}
     */
    validate() {
        this.errors = {};
        if (Util.isEmpty(this.pathToBag)) {
            this.errors['ValidationOperation.pathToBag'] = Context.y18n.__('You must specify the path to the bag you want to validate.');
        } else if (!fs.existsSync(this.pathToBag)) {
            this.errors['ValidationOperation.pathToBag'] = Context.y18n.__('The bag to be validated does not exist at %s', this.pathToBag);
        }
        return Object.keys(this.errors).length == 0;
    }


    /**
     * This converts the JSON representation of a ValidationOperation to a
     * full-fledged ValidationOperation object with all of the expected methods.
     *
     * @param {Object} data - A JavaScript hash.
     *
     * @returns {ValidationOperation}
     */
    static inflateFrom(data) {
        let op = new ValidationOperation();
        Object.assign(op, data);
        if (data.result) {
            op.result = OperationResult.inflateFrom(data.result);
        }
        return op;
    }
}

module.exports.ValidationOperation = ValidationOperation;
