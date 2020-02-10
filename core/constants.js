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
     * The UUID of the plugin that writes files directly to the filesystem.
     *
     * @type {string}
     */
    DIRECTORY_WRITER_UUID: '92e69251-0e76-412d-95b6-987a79f6fa71',
    /**
     * An empty UUID. This is used as the identifier for ExportSettings.
     *
     * @type {string}
     */
    EMPTY_UUID: "00000000-0000-0000-0000-000000000000",
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
     * to file extension patterns. We can use this to identify
     * the file mime type by examining a file's extension.
     *
     * @type {Object<string, RegExp>}
     */
    SERIALIZATION_FORMATS: {
        "application/x-7z-compressed": new RegExp("\.7z$", 'i'),
        "application/tar": new RegExp("\.tar$"),
        "application/zip": new RegExp("\.zip$"),
        "application/gzip": new RegExp("\.gzip$|\.gz$"),
        "application/x-rar-compressed": new RegExp("\.rar$"),
        "application/tar+gzip": new RegExp("\.tgz$|\.tar\.gz$")
    },
    /**
     * This maps serialization formats found in BagItProfiles
     * to file extensions. The bagger and other classes can use
     * this to assign a file extension based on a given mime type.
     *
     * @type {Object<string, string>}
     */
    SERIALIZATION_EXTENSIONS: {
        "application/x-7z-compressed": ".7z",
        "application/tar": ".tar",
        "application/zip": ".zip",
        "application/gzip": ".gz",
        "application/x-rar-compressed": ".rar",
        "application/tar+gzip": ".tar.gz"
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
    RE_DOT_KEEP_FILE: new RegExp('\/\.keep$|\\\.keep$', 'i'),
    /**
     * This exit code indicates a process completed successfully,
     * with no errors.
     *
     * @type {number}
     */
    EXIT_SUCCESS: 0,
    /**
     * This exit code indicates a process ran to completion, but one
     * or more errors occurred along the way.
     *
     * @type {number}
     */
    EXIT_COMPLETED_WITH_ERRORS: 1,
    /**
     * This exit code indicates a process did not complete
     * due to invalid parameters.
     *
     * @type {number}
     */
    EXIT_INVALID_PARAMS: 2,
    /**
     * This exit code indicates that the process did not complete
     * due to an unexpected runtime error.
     *
     * @type {number}
     */
    EXIT_RUNTIME_ERROR: 3,
    /**
     * Exit codes defines a list of valid exit codes. The codes are
     * defined in the Constants.EXIT_* constants.
     *
     * @type {Array<string>}
     */
    EXIT_CODES: [0,1,2,3],
    /**
     * This describes the status of an operation that is currently
     * in progress. An operation is a component of a job, such as
     * packaging, validation, or uploading.
     *
     * @type {string}
     */
    OP_IN_PROGRESS: 'In Progress',
    /**
     * This describes the status of an operation that has completed
     * successfully. An operation is a component of a job, such as
     * packaging, validation, or uploading.
     *
     * @type {string}
     */
    OP_SUCCEEDED: 'Succeeded',
    /**
     * This describes the status of an operation that has failed.
     * An operation is a component of a job, such as
     * packaging, validation, or uploading.
     *
     * @type {string}
     */
    OP_FAILED: 'Failed',
    /**
     * This is the list of valid operation statuses.
     *
     * @type {string}
     */
    OP_STATUSES: ['In Progress', 'Succeeded', 'Failed'],
    /**
     * This hash maps job operations to user-friendly error descriptions.
     *
     * @type {Object<string, string>}
     */
    JOB_ERROR_MESSAGES: {
        'package': 'Packaging error',
        'validate': 'Validation error',
        'upload': 'Upload error'
    },
    /**
     * Regular expression to match domain names.
     *
     * @type {RegExp}
     */
    RE_DOMAIN: /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i,
    /**
     * Regular expression to match valid IPV4 addresses.
     * Thank you O'Reilly regex cookbook.
     *
     * @type {RegExp}
     */
    RE_IPV4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,

    /**
     * Regular expression pattern to match valid file paths on
     * POSIX systems.
     *
     * @type {RegExp}
     */
    RE_FILE_PATH_POSIX: /^(\/?[^\/\0]+\/?)+$/i,
    /**
     * Regular expression pattern to match valid file paths on
     * Windows systems.
     *
     * @type {RegExp}
     */
    RE_FILE_PATH_WINDOWS: /^(?:[a-z]:|\\\\[a-z0-9_.$-]+\\[a-z0-9_.$-]+)\\(?:[^\\\/:*?"<>|\r\n]+\\)*[^\\\/:*?"<>|\r\n]*$/i,
    /**
     * Regular expression pattern to match valid file paths on
     * POSIX and Windows systems.
     *
     * @type {RegExp}
     */
    RE_FILE_PATH_ANY_OS: /^(\/?[^\/\0]+\/?)+$|^(?:[a-z]:|\\\\[a-z0-9_.$-]+\\[a-z0-9_.$-]+)\\(?:[^\\\/:*?"<>|\r\n]+\\)*[^\\\/:*?"<>|\r\n]*$/i,
    /**
     * This regular expression pattern matches valid email addresses.
     * Thank you, StackOverflow.
     *
     * @type {RegExp}
     */
    RE_EMAIL: /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i

};

Object.freeze(Constants);

module.exports.Constants = Constants;
