class AppSetting {
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
    validate() {
        // Return ValidationResult w/ isValid and errors
    }
    toForm() {
        // Return a form object that can be passed to a template
    }
    static fromForm() {
        // Parses a form and returns an AppSetting object
    }
}

module.exports.AppSetting = AppSetting;
