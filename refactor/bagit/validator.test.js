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

test('Validator accepts valid bag', done => {
    let testDir = path.join(__dirname, "..", "test");
    let profilePath = path.join(testDir, "profiles", "aptrust_bagit_profile_2.2.json");
    let bagPath = path.join(testDir, "bags", "aptrust", "example.edu.sample_good.tar")
    let profile = BagItProfile.load(profilePath);
    let validator = new Validator(bagPath, profile);

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
