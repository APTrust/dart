/**
 * BagItProfileInfo contains some basic info about the bagit profile
 * and the sender, adhering to the structure of bagit-profiles at
 * https://github.com/ruebot/bagit-profiles.
 * @constructor
 */
class BagItProfileInfo {
    constructor() {
        /**
         * BagItProfileIdentifier is the URL where this bagit profile can be found.
         * @type {string}
         */
        this.bagItProfileIdentifier = "";
        /**
         * ContactEmail is the email address of the person maintaining this
	     * bagit profile.
         * @type {string}
         */
        this.contactEmail = "";
        /**
         * ContactName is the name of the person maintaining this profile.
         * @type {string}
         */
        this.contactName = "";
        /**
         * ExternalDescription describes what this profile is for. For example,
	     * "BagIt profile for ingesting content into APTrust."
         * @type {string}
         */
        this.externalDescription = "";
        /**
         * SourceOrganization is the name of the organization maintaining this
	     * profile.
         * @type {string}
         */
        this.sourceOrganization = "";
        /**
         * Version is the version number of this profile. E.g "1.2".
         * @type {string}
         */
        this.version = "";
    }
}

class TagDefinition {
    constructor() {
        /**
         * tagName is the name of the tag. E.g. "BagIt-Version" or "Source-Organization".
         * @type {string}
         */
        this.tagName = "";
        /**
         * required indicates whether the tag must be present.
         * @type {boolean}
         */
        this.required = false;
        /**
         * emptyOk indicates whether the tag may legally be empty. A BagIt profile
         * may specify that a tag must be present and may be empty.
         * @type {boolean}
         */
        this.emptyOk = true;
        /**
         * values is a list of legal values for this tag. For example, a profile
         * may specify that BagIt versions "0.95", "0.96" and "0.97" are valid
         * by placing them in the values list for the tag with tagname "BagIt-Version".
         * If the values list is empty, then any value will be allowed.
         * @type {string[]}
         */
        this.values = [];
    }
}

/**
 * BagItProfile is a slightly modified version of bagit-profiles at
 * https://github.com/ruebot/bagit-profiles.
 * In this version, the Tag-Files-Required list is not a list of
 * strings, but a list of TagFile objects, like the BagInfo object
 * in bagit-profiles. This lets us validate the presence and value
 * of specific tags in any tag file the same way bagit-profile lets
 * us validate tags in the bagit.txt file.
 * @constructor
 */
class BagItProfile {
    constructor() {
        /**
         * A list of acceptable BagIt versions. For example, ["0.96", "0.97"]
         * @type {string[]}
         */
        this.acceptBagItVersion = [];
        /**
         * acceptSerialization is a list of BagIt serialization formats
	     * to accept. For example, ["application/zip", "application/tar"]
         * @type {string[]}
         */
        this.acceptSerialization = [];
        /**
         * allowFetchTxt indicates whether we allow a fetch.txt file in the bag.
         * @type {boolean}
         */
        this.allowFetchTxt = false;
        /**
         * allowMiscTopLevelFiles indicates whether we allow files in the top-level
	     * directory other than payload manifests and tag manifests.
         * @type {boolean}
         */
        this.allowMiscTopLevelFiles = false;
        /**
	     * allowMiscDirectories indicates whether we allow miscellaneous
	     * directories to exist outside the data directory. These non-data
	     * directories often contain custom tag files whose checksums may
	     * not appear in any manifest.
         * @type {boolean}
         */
        this.allowMiscDirectories = false;
        /**
         * bagItProfileInfo contains descriptive information about this
	     * BagIt profile.
         * @type {BagItProfileInfo}
         */
        this.bagItProfileInfo = new BagItProfileInfo();
        /**
          * ManifestsRequired is a list of payload manifests that must be
	      * in the bag. Values in this list are the algoritm names. So, to
	      * require manifest-md5.txt and manifest-sha256.txt, the list
	      * should contain just ["md5", "sha256"].
          * @type {string[]}
         */
        this.manifestsRequired = [];
        /**
         * serialization describes whether the bag can or may be serialized.
         * Valid options are "required", "optional" or "forbidden."
         * @type {string}
         */
        this.serialization = "optional";
        /**
         * tagFiles is a list of TagFile objects, each of which describes
	      * a tag file in the bag. Here, we differ from the bagit-profiles
	      * specification in that ALL tag files in the list are objects
	      * instead of strings, and the objects describe tags we expect to
	      * find in the files. Since TagFile objects have a Required property,
	      * we omit bagit-profiles' TagFilesRequired, because that would be
	      * redundant.
         * @type {Object.<string, TagDefinition>}
         */
        this.tagFilesRequired = {};
        /**
         * TagManifestsRequired is a list of required tag manifests. Like
	     * ManifestsRequired, the list contains only the names of the
	     * required hashing algorithms. E.g. ["md5", "sha256"]
         * @type {string[]}
         */
        this.tagManifestsRequired = [];
    }
}

class KeyValuePair {
    constructor(key, value) {
        this.key = key;
        this.value = value;
    }
}

class KeyValueCollection {
    constructor() {
        this.items = [];
    }

    append(item) {

    }

    keys() {

    }

    values() {

    }

    length() {

    }

    allValuesFor(key) {

    }

    firstValueFor(key) {

    }

    items() {

    }

    deleteItem(item) {

    }

    deleteByKey(key) {

    }
}

class Bag {
    constructor() {
        this.name = "";
        this.size = 0;
        this.storageUrl = "";
        this.registryId = "";
        this.files = [];
        this.createdAt = null;
        this.storedAt = null;
    }
}

class File {
    constructor() {
        this.localPath = "";
        this.pathInBag = "";
        this.size = 0;
        this.checksums = {}; // key = algorithm, value = digest
    }
}

class StorageService {
    constructor() {
        this.name = "";
        this.description = "";
        this.protocol = "";
        this.url = "";
        this.root = "";
        this.login = "";
        this.password = "";
        this.loginExtra = "";
    }
}

class Workflow {
    constructor() {
        this.name = "";
        this.description = "";
        this.bagItProfile = null;
        this.defaultTagValues = {}; // key = tagFilePath, value = KeyValuePair
        this.storageService = null;
        this.serializationFormat = null;
    }
}

class Job {
    constructor() {
        this.bag = null;
        this.files = [];
        this.workflow = null;
        this.customTagValues = {}; // key = tagFilePath, value = KeyValuePair
        this.startedAt = null;
        this.finishedAt = null;
    }
}

module.exports.BagItProfile = BagItProfile
module.exports.BagItProfileInfo = BagItProfileInfo
module.exports.TagDefinition = TagDefinition
module.exports.KeyValuePair = KeyValuePair;
module.exports.KeyValueCollection = KeyValueCollection;
module.exports.Bag = Bag;
module.exports.File = File;
module.exports.StorageService = StorageService;
module.exports.Workflow = Workflow;
module.exports.Job = Job;
