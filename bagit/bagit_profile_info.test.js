const { BagItProfileInfo } = require('./bagit_profile_info');

// Not much to test here, since this is just a data object.
test('Constructor returns the object', () => {
    let obj = new BagItProfileInfo();
    expect(obj.bagItProfileIdentifier).toEqual('https://example.com/profile.json');
    expect(obj.contactEmail).toEqual('');
    expect(obj.contactName).toEqual('');
    expect(obj.externalDescription).toEqual('');
    expect(obj.sourceOrganization).toEqual('');
    expect(obj.version).toEqual('');
});
