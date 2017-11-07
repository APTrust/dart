class StorageService {
    constructor(name) {
        this.name = name;
        this.description = "";
        this.protocol = "";
        this.url = "";
        this.bucket = "";
        this.loginName = "";
        this.loginPassword = "";
        this.loginExtra = "";
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

module.exports.StorageService = StorageService;
