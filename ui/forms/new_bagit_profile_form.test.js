const { BagItProfile } = require('../../bagit/bagit_profile');
const { NewBagItProfileForm } = require('./new_bagit_profile_form');
const { TestUtil } = require('../../core/test_util');
const { UITestUtil } = require('../common/ui_test_util');

beforeEach(() => {
    TestUtil.deleteJsonFile('BagItProfile');
});

afterAll(() => {
    TestUtil.deleteJsonFile('BagItProfile');
});

test('create()', () => {

    // Throw a couple of profiles into the test DB.
    TestUtil.loadProfilesFromSetup('aptrust')[0].save();
    TestUtil.loadProfilesFromSetup('dpn')[0].save();

    let form = new NewBagItProfileForm();
    expect(Object.keys(form.fields).length).toEqual(1);

    let profiles = BagItProfile.list(null, {
            limit: 0,
            offset: 0,
            orderBy: 'name',
            sortDirection: 'asc'
    });

    // Choices should include two profiles loaded above, plus an empty option.
    expect(form.fields.baseProfile.choices.length).toEqual(3);
    let choices = form.fields.baseProfile.choices.map(c => c.value);
    for (let profile of profiles) {
        expect(choices).toContain(profile.id);
    }
});
