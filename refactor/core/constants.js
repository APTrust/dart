const Constants =  {
    PAYLOAD_FILE: 'payload',
    PAYLOAD_MANIFEST: 'manifest',
    TAG_MANIFEST: 'tagmanifest',
    TAG_FILE: 'tagfile',
    FILE_TYPES: [PAYLOAD_FILE, PAYLOAD_MANIFEST, TAG_MANIFEST, TAG_FILE],
    BAGIT_VERSIONS: ["0.97"],
    DIGEST_ALGORITHMS: ["md5", "sha1", "sha224", "sha256", "sha384", "sha512"],
    REQUIREMENT_OPTIONS: ["required", "optional", "forbidden"],
    YES_NO: ["Yes", "No"]
};

Object.freeze(Constants);

module.exports.Constants = Constants;
