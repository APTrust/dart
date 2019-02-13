const $ = require('jquery');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { BagItProfileForm } = require('./bagit_profile_form');
const { TestUtil } = require('../../core/test_util');

const expectedFields = [
    'id',
    'name',
    'description',
    'acceptBagItVersion',
    'acceptSerialization',
    'allowFetchTxt',
    'allowMiscTopLevelFiles',
    'allowMiscDirectories',
    'manifestsRequired',
    'tagManifestsRequired',
    'serialization',
    'tarDirMustMatchName',
    'infoIdentifier',
    'infoContactEmail',
    'infoContactName',
    'infoExternalDescription',
    'infoSourceOrganization',
    'infoVersion'
];

test('create()', () => {
    let profile = TestUtil.loadProfile('aptrust_bagit_profile_2.2.json');
    let form = new BagItProfileForm(profile);
    expect(Object.keys(form.fields).length).toEqual(expectedFields.length);

    // Make sure all fields got the right value.
    for (let name of expectedFields) {
        let field = form.fields[name];
        if (name.startsWith('info')) {
            let propertyName = form.toObjectPropertyName(name);
            expect(field.value).toEqual(profile.bagItProfileInfo[propertyName]);
        } else {
            expect(field.value).toEqual(profile[name]);
        }
    }
});

test('parseFromDOM()', () => {
    let profile = TestUtil.loadProfile('aptrust_bagit_profile_2.2.json');
    let form = new BagItProfileForm(profile);

});
