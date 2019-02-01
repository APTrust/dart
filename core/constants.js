/**
 * Constants used throughout DART.
 *
 */
const Constants =  {
    /**
     * Describes the payload file type. This is used by the bagger
     * and bag validator in BagItFile.fileType.
     *
     * @type {string}
     */
    PAYLOAD_FILE: 'payload',
    /**
     * Describes the payload manifest file type. This is used by the bagger
     * and bag validator in BagItFile.fileType.
     *
     * @type {string}
     */
    PAYLOAD_MANIFEST: 'manifest',
    /**
     * Describes the tag manifest file type. This is used by the bagger
     * and bag validator in BagItFile.fileType.
     *
     * @type {string}
     */
    TAG_MANIFEST: 'tagmanifest',
    /**
     * Describes the tag file file type. This is used by the bagger
     * and bag validator in BagItFile.fileType.
     *
     * @type {string}
     */
    TAG_FILE: 'tagfile',
    /**
     * This is the list of types of files that can appear inside a bag.
     *
     * @type {string[]}
     */
    FILE_TYPES: ['payload', 'manifest', 'tagmanifest', 'tagfile'],
    /**
     * This is the list of BagIt versions that the bagger and validator
     * understand.
     *
     * @type {string[]}
     */
    BAGIT_VERSIONS: ["0.97", "1.0"],
    /**
     * This is the list of digest algorithms that the bagger and
     * validator understand. The bagger can produce manifests and
     * tag manifests using these algorithms, and the validator can
     * validate them.
     *
     * @type {string[]}
     */
    DIGEST_ALGORITHMS: ["md5", "sha1", "sha224", "sha256", "sha384", "sha512"],
    /**
     * This is a list of valid values for fields like
     * BagItProfile.serialization.
     *
     * @type {string[]}
     */
    REQUIREMENT_OPTIONS: ["required", "optional", "forbidden"],
    /**
     * This list of valid options for yes/no questions is used
     * primarily in the UI.
     *
     * @type {string[]}
     */
    YES_NO: ["Yes", "No"],
    /**
     * This is the unique identifier of the built-in DART FileSystemReader
     * plugin.
     *
     * @type {string}
     */
    FILESYSTEM_READER_UUID: '265f724e-8289-4bf7-bbdf-803a65bcdf19',
    /**
     * This regular expression matches the name of payload
     * manifest files, and includes a capture to extract the
     * checksum algorithm.
     *
     * @type {RegExp}
     */
    RE_MANIFEST: new RegExp('^manifest-(\\w+)\\.txt$'),
    /**
     * This list of valid options for yes/no questions is used
     * primarily in the UI.
     *
     * @type {RegExp}
     */
    RE_TAG_MANIFEST: new RegExp('^tagmanifest-(\\w+)\\.txt$'),
    /**
     * This maps serialization formats found in BagItProfiles
     * to file extensions.
     *
     * @type {Object<string, RegExp>}
     */
    SERIALIZATION_FORMATS: {
        "application/x-7z-compressed": new RegExp("\.7z$", 'i'),
        "application/tar": new RegExp("\.tar$"),
        "application/zip": new RegExp("\.zip$"),
        "application/gzip": new RegExp("\.gzip$|\.gz$"),
        "application/x-rar": new RegExp("\.rar$"),
        "application/tar+gzip": new RegExp("\.tgz$|\.tar\.gz$")
    },
    /**
     * This maps serialization formats found in BagItProfiles
     * to file extensions. Key is the name of the profile,
     * value is the profile's UUID.
     *
     * @type {Object<string, string>}
     */
    BUILTIN_PROFILE_IDS: {
        "aptrust": "043f1c22-c9ff-4112-86f8-8f8f1e6a2dca",
        "dpn": "09c834a7-6b51-49dd-9498-b310ee3e5a6a"
    },
    /**
     * Regular Expression to match OSX DS_Store files. We often
     * want to omit these when creating bags.
     *
     * @type {RegExp}
     */
    RE_MAC_JUNK_FILE: new RegExp('\\._DS_Store$|\\.DS_Store$', 'i'),
    /**
     * Regular Expression to match Mac/Linux hidden files that begin.
     * with a period. Users may choose to omit these when creating bags.
     *
     * @type {RegExp}
     */
    RE_DOT_FILE: new RegExp('^\.[^\/]+$|^\.[^\\\\]+$'),
    /**
     * Regular Expression to match .keep files. When users choose to
     * omit dot files, they often want to or need to keep these files
     * which have a special significance in certain applications.
     *
     * @type {RegExp}
     */
    RE_DOT_KEEP_FILE: new RegExp('\/\.keep$|\\\.keep$', 'i')
};

Object.freeze(Constants);

module.exports.Constants = Constants;
