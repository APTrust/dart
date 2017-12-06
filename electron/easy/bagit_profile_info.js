module.exports = class BagItProfileInfo {
    constructor() {
        this.bagItProfileIdentifier = "";
        this.contactEmail = "";
        this.contactName = "";
        this.externalDescription = "";
        this.sourceOrganization = "";
        this.version = "";
    }
    objectType() {
        return 'BagItProfileInfo';
    }
}
