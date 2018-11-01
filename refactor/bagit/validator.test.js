const { BagItProfile } = require('./bagit_profile');
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
});
