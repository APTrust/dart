const { BagItProfile } = require('./bagit_profile');
const path = require('path');
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
    expect(validator.reader).toBeNull();
    expect(validator.errors).not.toBeNull();
    expect(validator.errors.length).toEqual(0);
    expect(validator.readingFromTar()).toEqual(true);
});

function getValidator(profileName, bagName) {
    let testDir = path.join(__dirname, "..", "test");
    let profilePath = path.join(testDir, "profiles", profileName);
    let bagPath = path.join(testDir, "bags", "aptrust", bagName)
    let profile = BagItProfile.load(profilePath);
    return new Validator(bagPath, profile);
}

test('Validator accepts valid bag', done => {
    let validator = getValidator("aptrust_bagit_profile_2.2.json", "example.edu.sample_good.tar");
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

test('file type methods return correct items', done => {
    let validator = getValidator("aptrust_bagit_profile_2.2.json", "example.edu.tagsample_good.tar");
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
    // TODO: Write me.
});
