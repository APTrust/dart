const { BagItProfile } = require('./bagit_profile');
const { Context } = require('../core/context');
const FileSystemReader = require('../plugins/formats/read/file_system_reader');
const path = require('path');
const TarReader = require('../plugins/formats/read/tar_reader');
const { TestUtil } = require('../core/test_util');
const { Validator } = require('./validator');

test('Constructor sets initial properties', () => {
    let profile = new BagItProfile();
    let validator = new Validator("/path/to/bag.tar", profile);
    expect(validator.pathToBag).toEqual("/path/to/bag.tar");
    expect(validator.profile.name).toEqual(profile.name);
    expect(validator.bagName).toEqual("bag");
    expect(validator.files).not.toBeNull();
    expect(validator.payloadFiles).not.toBeNull();
    expect(validator.payloadFiles.length).toEqual(0);
    expect(validator.payloadManifests).not.toBeNull();
    expect(validator.payloadManifests.length).toEqual(0);
    expect(validator.tagFiles).not.toBeNull();
    expect(validator.tagFiles.length).toEqual(0);
    expect(validator.tagManifests).not.toBeNull();
    expect(validator.tagManifests.length).toEqual(0);
    expect(validator.topLevelDirs).not.toBeNull();
    expect(validator.topLevelDirs.length).toEqual(0);
    expect(validator.topLevelFiles).not.toBeNull();
    expect(validator.topLevelFiles.length).toEqual(0);
    expect(validator.errors).not.toBeNull();
    expect(validator.errors.length).toEqual(0);
    expect(validator.readingFromTar()).toEqual(true);
});

test('file type methods return correct items', done => {
    let validator = getValidator("aptrust_bagit_profile_2.2.json", "aptrust", "example.edu.tagsample_good.tar");
    let taskCount = 0;
    validator.on('error', function(err) {
        // Force failure & stop test.
        expect(err).toBeNull();
        done();
    });
    validator.on('end', function(taskDesc) {
        expect(validator.payloadFiles().length).toEqual(4);
        expect(validator.payloadManifests().length).toEqual(2);
        expect(validator.tagFiles().length).toEqual(8);
        expect(validator.tagManifests().length).toEqual(2);
        done();
    });

    validator.validate();
});

test('_cleanEntryRelPath()', () => {
    let validator = getValidator("aptrust_bagit_profile_2.2.json", "aptrust", "example.edu.tagsample_good.tar");
    let relPayloadPath = "example.edu.tagsample_good/data/sample.txt";
    let relManifestPath = "example.edu.tagsample_good/manifest-sha256.txt";
    expect(validator._cleanEntryRelPath(relPayloadPath)).toEqual("data/sample.txt");
    expect(validator._cleanEntryRelPath(relManifestPath)).toEqual("manifest-sha256.txt");
});

test('_validateProfile()', () => {
    var validator = getValidator("aptrust_bagit_profile_2.2.json", "aptrust", "example.edu.tagsample_good.tar");
    expect(validator._validateProfile()).toEqual(true);
    expect(validator.errors).toEqual([]);

    let expected = ["BagItProfile: Profile must accept at least one BagIt version.",
                    "BagItProfile: Profile must require at least one manifest.",
                    "BagItProfile: Profile lacks requirements for bagit.txt tag file.\nProfile lacks requirements for bag-info.txt tag file.",
                    "BagItProfile: Serialization must be one of: required, optional, forbidden."];
    let validator2 = getValidator("invalid_profile.json", "aptrust", "example.edu.tagsample_good.tar");
    expect(validator2._validateProfile()).toEqual(false);
    expect(validator2.errors).toEqual(expected);
});

test('readingFromTar()', () => {
    let validator = getValidator("aptrust_bagit_profile_2.2.json", "aptrust", "example.edu.tagsample_good.tar");
    expect(validator.readingFromTar()).toEqual(true);

    validator = getValidator("aptrust_bagit_profile_2.2.json", "aptrust", "example.edu.sample_good");
    expect(validator.readingFromTar()).toEqual(false);
});

test('readingFromDir()', () => {
    let validator = getValidator("aptrust_bagit_profile_2.2.json", "aptrust", "example.edu.tagsample_good.tar");
    expect(validator.readingFromDir()).toEqual(false);

    validator = getValidator("aptrust_bagit_profile_2.2.json", "aptrust", "example.edu.sample_good");
    expect(validator.readingFromDir()).toEqual(true);
});

test('fileExtension()', () => {
    let validator = new Validator("path/to/bag.tar", new BagItProfile());
    expect(validator.fileExtension()).toEqual(".tar");

    validator.pathToBag = "path/to/bag.tar.gz";
    expect(validator.fileExtension()).toEqual(".tar.gz");

    validator.pathToBag = "path/to/bag.zip";
    expect(validator.fileExtension()).toEqual(".zip");

    validator.pathToBag = "path/to/bag";
    expect(validator.fileExtension()).toEqual("");
});

test('getNewReader()', () => {
    let validator = getValidator("aptrust_bagit_profile_2.2.json", "aptrust", "example.edu.tagsample_good.tar");
    let reader = validator.getNewReader();
    expect(reader instanceof TarReader).toEqual(true);

    validator = getValidator("aptrust_bagit_profile_2.2.json", "aptrust", "example.edu.sample_good");
    reader = validator.getNewReader();
    expect(reader instanceof FileSystemReader).toEqual(true);
});

// --------- FROM HERE DOWN, TEST ACTUAL BAGS ----------- //

function getValidator(profileName, bagDir, bagName) {
    let testDir = path.join(__dirname, "..", "test");
    //let profilePath = path.join(testDir, "profiles", profileName);
    let bagPath = path.join(testDir, "bags", bagDir, bagName)
    //let profile = BagItProfile.load(profilePath);
    let profile = TestUtil.loadProfile(profileName);
    return new Validator(bagPath, profile);
}

test('Validator emits error if bag does not exist', done => {
    let validator = getValidator("aptrust_bagit_profile_2.2.json", "aptrust", "BagDoesNotExist.tar");
    validator.on('error', function(message) {
        expect(message).toMatch(Context.y18n.__('File does not exist at'));
        expect(validator.errors.length).toEqual(1);
        expect(validator.errors[0]).toMatch(Context.y18n.__('File does not exist at'));
        expect(validator.errors[0]).toMatch(/BagDoesNotExist.tar$/);
    });
    validator.on('end', function() {
        done();
    });
    expect(function() { validator.validate() }).not.toThrow();
});

// Uses TarReader
test('Validator emits expected events for tarred APTrust bag', done => {
    let validator = getValidator("aptrust_bagit_profile_2.2.json", "aptrust", "example.edu.sample_good.tar");
    let taskCount = 0;
    validator.on('task', function(taskDesc) {
        taskCount++;
    });
    validator.on('error', function(err) {
        // Force failure & stop test.
        expect(err).toBeNull();
        done();
    });
    validator.on('end', function(taskDesc) {
        expect(taskCount).toEqual(18);
        done();
    });

    validator.validate();
});

test('Validator accepts valid APTrust bag with additional tags', done => {
    let validator = getValidator("aptrust_bagit_profile_2.2.json", "aptrust", "example.edu.tagsample_good.tar");
    validator.on('error', function(err) {
        // Force failure & stop test.
        expect(err).toBeNull();
        done();
    });
    validator.on('end', function() {
        expect(validator.errors).toEqual([]);
        expect(validator.errors.length).toEqual(0);
        done();
    });

    validator.validate();
});

// This test uses the FileSystemReader instead of the TarReader.
test('Validator emits expected events for untarred APTrust bag', done => {

    let validator = getValidator("aptrust_bagit_profile_2.2.json", "aptrust", "example.edu.sample_good");

    // APTrust profile requires tarred bags.
    // Tell the validator to ignore the bag forma
    // and focus instead on the contents.
    validator.disableSerializationCheck = true;

    let taskCount = 0;
    validator.on('task', function(taskDesc) {
        taskCount++;
    });
    validator.on('error', function(err) {
        // Force failure & stop test.
        expect(err).toBeNull();
        done();
    });
    validator.on('end', function(taskDesc) {
        expect(taskCount).toEqual(18);
        done();
    });

    validator.validate();
});

test('Validator accepts valid DPN bag', done => {
    let validator = getValidator("dpn_bagit_profile_2.1.json", "dpn", "a9f7cbab-b531-4eb7-b532-770f592629ba.tar");
    let taskCount = 0;
    validator.on('task', function(taskDesc) {
        taskCount++;
    });
    validator.on('error', function(err) {
        // Force failure & stop test.
        expect(err).toBeNull();
        done();
    });
    validator.on('end', function(taskDesc) {
        expect(taskCount).toEqual(22);
        done();
    });

    validator.validate();
});

test('Validator rejects bad DPN bag', done => {
    let validator = getValidator("dpn_bagit_profile_2.1.json", "dpn", "020c8edd-d043-4204-a6b8-26b6fb8bda5d.tar");
    let expected = ["File 'data/Users/diamond/go/src/golang.org/x/net/html/atom/gen.go' in manifest-sha256.txt is missing from bag.", "Bad sha256 digest for 'dpn-tags/dpn-info.txt': manifest says '935e01c6f9ecf565c67c32760a9cec966d2f24bf2654533394d44924e19ecda2', file digest is 'cfab0747e203bc0d419d331b6fca48b66c8a5f045738fbf4608d2424ff28823e'."];
    validator.on('error', function(err) {
        // Force failure & stop test.
        expect(err).toBeNull();
        done();
    });
    validator.on('end', function() {
        expect(validator.errors).toEqual(expected);
        done();
    });

    validator.validate();
});


// This particular bag lets us test bad digests, missing files, and bad tag values.
test('Validator identifies errors in bad APTrust bag', done => {
    let validator = getValidator("aptrust_bagit_profile_2.2.json", "aptrust", "example.edu.tagsample_bad.tar");
    let expected = [
        "Bad sha256 digest for 'data/datastream-descMetadata': manifest says 'This-checksum-is-bad-on-purpose.-The-validator-should-catch-it!!', file digest is 'cf9cbce80062932e10ee9cd70ec05ebc24019deddfea4e54b8788decd28b4bc7'.",
        "File 'data/file-not-in-bag' in manifest-sha256.txt is missing from bag.",
        "Bad md5 digest for 'custom_tags/tracked_tag_file.txt': manifest says '00000000000000000000000000000000', file digest is 'dafbffffc3ed28ef18363394935a2651'.",
        "File 'custom_tags/tag_file_xyz.pdf' in tagmanifest-md5.txt is missing from bag.",
        "Bad sha256 digest for 'custom_tags/tracked_tag_file.txt': manifest says '0000000000000000000000000000000000000000000000000000000000000000', file digest is '3f2f50c5bde87b58d6132faee14d1a295d115338643c658df7fa147e2296ccdd'.",
        "File 'custom_tags/tag_file_xyz.pdf' in tagmanifest-sha256.txt is missing from bag.",
        "Tag 'Access' in aptrust-info.txt contains illegal value 'acksess'. [Allowed: Consortia, Institution, Restricted]",
        "Tag 'Storage-Option' in aptrust-info.txt contains illegal value 'Cardboard-Box'. [Allowed: Standard, Glacier-OH, Glacier-OR, Glacier-VA]",
        "Value for tag 'Title' in aptrust-info.txt is missing."
    ];
    validator.on('error', function(err) {
        // Force failure & stop test.
        expect(err).toBeNull();
        done();
    });
    validator.on('end', function(taskDesc) {
        expect(validator.errors).toEqual(expected);
        done();
    });

    validator.validate();
});

test('Validator identifies missing payload file', done => {
    let validator = getValidator("aptrust_bagit_profile_2.2.json", "aptrust", "example.edu.sample_missing_data_file.tar");
    let expected = ["File 'data/datastream-DC' in manifest-md5.txt is missing from bag.",
                    "Required tag Access is missing from aptrust-info.txt",
                    "Required tag Storage-Option is missing from aptrust-info.txt"];

    validator.on('error', function(err) {
        // Force failure & stop test.
        expect(err).toBeNull();
        done();
    });
    validator.on('end', function(taskDesc) {
        expect(validator.errors).toEqual(expected);
        done();
    });

    validator.validate();
});

test('Validator identifies missing tag file', done => {
    let validator = getValidator("aptrust_bagit_profile_2.2.json", "aptrust", "example.edu.sample_no_bag_info.tar");
    let expected = ["Required tag file bag-info.txt is missing",
                    "Required tag Access is missing from aptrust-info.txt",
                    "Required tag Storage-Option is missing from aptrust-info.txt"];

    validator.on('error', function(err) {
        // Force failure & stop test.
        expect(err).toBeNull();
        done();
    });
    validator.on('end', function(taskDesc) {
        expect(validator.errors).toEqual(expected);
        done();
    });

    validator.validate();
});

test('Validator identifies missing data dir', done => {
    let validator = getValidator("aptrust_bagit_profile_2.2.json", "aptrust", "example.edu.sample_no_data_dir.tar");
    let expected = [
        "File 'data/datastream-DC' in manifest-md5.txt is missing from bag.",
        "File 'data/datastream-descMetadata' in manifest-md5.txt is missing from bag.",
        "File 'data/datastream-MARC' in manifest-md5.txt is missing from bag.",
        "File 'data/datastream-RELS-EXT' in manifest-md5.txt is missing from bag.",
        "Required tag Storage-Option is missing from aptrust-info.txt"];

    validator.on('error', function(err) {
        // Force failure & stop test.
        expect(err).toBeNull();
        done();
    });
    validator.on('end', function(taskDesc) {
        expect(validator.errors).toEqual(expected);
        done();
    });

    validator.validate();
});

test('Validator identifies missing manifest', done => {
    let validator = getValidator("aptrust_bagit_profile_2.2.json", "aptrust", "example.edu.sample_no_md5_manifest.tar");
    let expected = ["Bag is missing required manifest manifest-md5.txt",
                    "Required tag Storage-Option is missing from aptrust-info.txt"];

    validator.on('error', function(err) {
        // Force failure & stop test.
        expect(err).toBeNull();
        done();
    });
    validator.on('end', function(taskDesc) {
        expect(validator.errors).toEqual(expected);
        done();
    });

    validator.validate();
});

test('Validator identifies wrong folder name', done => {
    let validator = getValidator("aptrust_bagit_profile_2.2.json", "aptrust", "example.edu.sample_wrong_folder_name.tar");
    let expected = ["Bag should untar to directory 'example.edu.sample_wrong_folder_name', not 'wrong_folder_name'"];

    validator.on('error', function(err) {
        // Force failure & stop test.
        expect(err).toBeNull();
        done();
    });
    validator.on('end', function(taskDesc) {
        expect(validator.errors).toEqual(expected);
        done();
    });

    validator.validate();
});

test('Validator rejects unserialized bag if profile says it must be serialized', done => {
    let validator = getValidator("aptrust_bagit_profile_2.2.json", "aptrust", "example.edu.sample_good");
    let expected = [Context.y18n.__("Profile says bag must be serialized, but it is a directory.")];

    validator.on('error', function(err) {
        // Force failure & stop test.
        expect(err).not.toBeNull();
        done();
    });
    validator.on('end', function(taskDesc) {
        expect(validator.errors).toEqual(expected);
        done();
    });

    validator.validate();
});

test('Validator ignores serialization rules when disableSerializationCheck is true', done => {
    let validator = getValidator("aptrust_bagit_profile_2.2.json", "aptrust", "example.edu.sample_good");
    validator.disableSerializationCheck = true;

    validator.on('error', function(err) {
        // Force failure & stop test.
        expect(err).toBeNull();
        done();
    });

    validator.on('end', function(taskDesc) {
        expect(validator.errors).toEqual([]);
        done();
    });

    validator.validate();
});

test('Validator finds bad Payload-Oxum', done => {
    let validator = getValidator("aptrust_bagit_profile_2.2.json", "aptrust", "example.edu.sample_bad_oxum.tar");
    let expected = [
        "Payload-Oxum says there should be 24 files in the payload, but validator found 4.",
        "Payload-Oxum says there should be 99999 bytes in the payload, but validator found 13821."]

    validator.on('error', function(err) {
        // Force failure & stop test.
        expect(err).toBeNull();
        done();
    });

    validator.on('end', function(taskDesc) {
        expect(validator.errors).toEqual(expected);
        done();
    });

    validator.validate();
});
