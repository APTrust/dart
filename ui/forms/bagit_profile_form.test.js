const { BagItProfile } = require('../../bagit/bagit_profile');
const { BagItProfileForm } = require('./bagit_profile_form');
const { TestUtil } = require('../../core/test_util');

test('create()', () => {
    let profile = TestUtil.loadProfile('aptrust_bagit_profile_2.2.json');
    let form = BagItProfileForm.create(profile);

    // expect(Object.keys(form.fields).length).toEqual(11);

});
