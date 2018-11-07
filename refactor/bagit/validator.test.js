const { BagItProfile } = require('./bagit_profile');
const path = require('path');
const { Validator } = require('./validator');

// We expect the validator to find the following errors when testing
// some of our invalid bags.
var err_0 = "File 'data/file-not-in-bag' in manifest 'manifest-sha256.txt' is missing from bag";
var err_1 = "File 'custom_tags/tag_file_xyz.pdf' in manifest 'tagmanifest-md5.txt' is missing from bag";
var err_2 = "File 'custom_tags/tag_file_xyz.pdf' in manifest 'tagmanifest-sha256.txt' is missing from bag";
var err_3 = "Value for tag 'Title' is missing.";
var err_4 = "Tag 'Access' has illegal value 'acksess'.";
var err_5 = "Bad sha256 digest for 'data/datastream-descMetadata': manifest says 'This-checksum-is-bad-on-purpose.-The-validator-should-catch-it!!', file digest is 'cf9cbce80062932e10ee9cd70ec05ebc24019deddfea4e54b8788decd28b4bc7'";
var err_6 = "Bad md5 digest for 'custom_tags/tracked_tag_file.txt': manifest says '00000000000000000000000000000000', file digest is 'dafbffffc3ed28ef18363394935a2651'";
var err_7 = "Bad sha256 digest for 'custom_tags/tracked_tag_file.txt': manifest says '0000000000000000000000000000000000000000000000000000000000000000', file digest is '3f2f50c5bde87b58d6132faee14d1a295d115338643c658df7fa147e2296ccdd'";
var err_8 = "Tag 'Storage-Option' has illegal value 'cardboard-box'.";


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
    expect(validator.reader).toBeNull();
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


// --------- FROM HERE DOWN, TEST ACTUAL BAGS ----------- //

function getValidator(profileName, bagDir, bagName) {
    let testDir = path.join(__dirname, "..", "test");
    let profilePath = path.join(testDir, "profiles", profileName);
    let bagPath = path.join(testDir, "bags", bagDir, bagName)
    let profile = BagItProfile.load(profilePath);
    return new Validator(bagPath, profile);
}

test('Validator does not throw if bag does not exist', done => {
    let validator = getValidator("aptrust_bagit_profile_2.2.json", "aptrust", "BagDoesNotExist.tar");
    validator.on('end', function(taskDesc) {
        expect(validator.errors.length).toEqual(1);
        expect(validator.errors[0]).toMatch(/^File does not exist at/);
        expect(validator.errors[0]).toMatch(/BagDoesNotExist.tar$/);
        done();
    });
    expect(function() { validator.validate() }).not.toThrow();
});

test('Validator accepts valid APTrust bag', done => {
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
        expect(taskCount).toEqual(17);
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
        expect(taskCount).toEqual(21);
        done();
    });

    validator.validate();
});
