/**
 * BagItProfileInfo contains metadata about a BagItProfile, including
 * the version number, who maintains it, etc.
 *
 */
class BagItProfileInfo {
    constructor() {
        /**
         * A URL that uniquely identifies this profile.
         * The profile should be published at that URL.
         *
         * @type {string}
         */
        this.bagItProfileIdentifier = "";
        /**
         * The email address of the poor soul who has to
         * maintain this profile.
         *
         * @type {string}
         */
        this.contactEmail = "";
        /**
         * The name of this profile's maintainer.
         *
         * @type {string}
         */
        this.contactName = "";
        /**
         * A description of this profile.
         *
         * @type {string}
         */
        this.externalDescription = "";
        /**
         * The name of the organization that maintains this profile.
         *
         * @type {string}
         */
        this.sourceOrganization = "";
        /**
         * The version number of this profile.
         *
         * @type {string}
         */
        this.version = "";
    }
}

module.exports.BagItProfileInfo = BagItProfileInfo;
