module.exports = class ValidationResult {
    constructor(errors) {
        this.errors = {};
    }
    isValid() {
        return Object.keys(this.errors).length == 0;
    }
}
