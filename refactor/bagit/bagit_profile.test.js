const { BagItProfile } = require('./bagit_profile');
const { Util } = require('../core/util');

test('Constructor sets initial properties', () => {
    let profile = new BagItProfile();
    expect(profile.name).toEqual('New BagIt Profile');
    expect(profile.description).toEqual('New custom BagIt profile');

    profile = new BagItProfile('Test Profile', 'Profile for testing');
    expect(profile.name).toEqual('Test Profile');
    expect(profile.description).toEqual('Profile for testing');

    expect(profile.acceptBagItVersion).toEqual(['0.97']);
    expect(profile.acceptSerialization).toEqual(['tar']);
    expect(profile.allowFetchTxt).toEqual(false);
    expect(profile.allowMiscTopLevelFiles).toEqual(false);
    expect(profile.allowMiscDirectories).toEqual(false);
    expect(profile.bagItProfileInfo).not.toBeNull();
    expect(profile.manifestsRequired).toEqual(['sha256']);
    expect(profile.tagManifestsRequired).toEqual([]);
    expect(profile.tags.length).toEqual(16);
    expect(profile.serialization).toEqual('optional');
    expect(profile.baseProfileId).toEqual(null);
    expect(profile.isBuiltIn).toEqual(false);
});

test('validate() catches invalid properties', () => {
    let profile = new BagItProfile();
    profile.id = '';
    profile.name = '';
    profile.acceptBagItVersion = [];
    profile.manifestsRequired = [];
    profile.tags = [];
    profile.serialization = "Cap'n Crunch";
    let result = profile.validate();
    expect(result.isValid()).toEqual(false);
    expect(result.errors['id']).toEqual('Id cannot be empty.');
    expect(result.errors['name']).toEqual('Name cannot be empty.');
    expect(result.errors['acceptBagItVersion']).toEqual("Profile must accept at least one BagIt version.");
    expect(result.errors['manifestsRequired']).toEqual("Profile must require at least one manifest.");
    expect(result.errors['tags']).toEqual("Profile lacks requirements for bagit.txt tag file.\nProfile lacks requirements for bag-info.txt tag file.");
    expect(result.errors['serialization']).toEqual("Serialization must be one of: required, optional, forbidden.");
});
