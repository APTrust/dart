const { TestUtil } = require('./test_util');

test('TestUtil.deleteJsonFile does not blow up when file is missing', () => {
    expect(() => { TestUtil.deleteJsonFile('non-existent-file') })
        .not.toThrow(Error);
});

test('loadProfile', () => {
    let profiles = {
        'invalid_profile.json': 'This profile is not valid.',
        'multi_manifest.json': 'Modified version of APTrust 2.2',
    };
    for (let [filename, desc] of Object.entries(profiles)) {
        let profile = TestUtil.loadProfile(filename);
        expect(profile).toBeDefined();
        expect(profile.description.startsWith(desc)).toEqual(true);
    }
});

test('loadProfilesFromSetup', () => {
    let aptrust = TestUtil.loadProfilesFromSetup('aptrust');
    expect(aptrust.length).toEqual(1);
    expect(aptrust[0].name).toEqual("APTrust");
    expect(aptrust[0].tags.length).toEqual(14);
    expect(function() {
        TestUti.loadProfilesFromSetup('dir_does_not_exist');
    }).toThrow();
});

test('ISODatePattern', () => {
    expect('2019-04-22T10:17:33.000Z').toMatch(TestUtil.ISODatePattern);
});
