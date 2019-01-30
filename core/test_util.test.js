const { TestUtil } = require('./test_util');

test('TestUtil.deleteJsonFile does not blow up when file is missing', () => {
    expect(() => { TestUtil.deleteJsonFile('non-existent-file') })
        .not.toThrow(Error);
});

test('loadProfile', () => {
    let profiles = {
        'aptrust_bagit_profile_2.2.json': 'APTrust 2.2 default BagIt profile',
        'dpn_bagit_profile_2.1.json': 'Digital Preservation Network',
        'invalid_profile.json': 'This profile is not valid.',
        'multi_manifest.json': 'Modified version of APTrust 2.2',
    };
    for (let [filename, desc] of Object.entries(profiles)) {
        let profile = TestUtil.loadProfile(filename);
        expect(profile).toBeDefined();
        expect(profile.description.startsWith(desc)).toEqual(true);
    }
});
