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
    BAGIT_VERSIONS: ["0.97"],
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
    YES_NO: ["Yes", "No"]
};

Object.freeze(Constants);

module.exports.Constants = Constants;
