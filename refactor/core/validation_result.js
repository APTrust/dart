/**
 * ValidationResult contains information about the results of a
 * validation check.
 *
 * ValidationResult.errors is hash in which the keys are property
 * names and the values are error messages.
 */
class ValidationResult {
    constructor() {
        /**
           Hash of error messages. Key is the name of the property
           that is invalid, error is the message describing why it's
           invalid.

           @name ValidationResult#errors
           @type {Object.<string, string>}
        */
        this.errors = {};
    }
    /**
     * isValid returns true if the ValidationResult contains
     * no errors.
     */
    isValid() {
        return Object.keys(this.errors).length == 0;
    }
}

module.exports.ValidationResult = ValidationResult;
