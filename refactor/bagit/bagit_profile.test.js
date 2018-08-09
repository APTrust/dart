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
