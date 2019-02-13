const $ = require('jquery');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { BagItProfileForm } = require('./bagit_profile_form');
const Templates = require('../common/templates');
const { TestUtil } = require('../../core/test_util');
const { UITestUtil } = require('../common/ui_test_util');

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
    let dpnProfile = TestUtil.loadProfile('dpn_bagit_profile_2.1.json');
    let form = new BagItProfileForm(profile);

    // Create the HTML form and put it in the DOM.
    let html = Templates.bagItProfileForm({
        bagItProfileId: profile.id,
        form: form
    });
    UITestUtil.setDocumentBody({ container: html });

    // Change the value of each form field.
    for (let name of expectedFields) {
        let elementId = `#bagItProfileForm_${name}`;
        let value = dpnProfile[name];
        value = (value === true ? 'Yes' : value);
        value = (value === false ? 'No' : value);
        $(elementId).val(value);
    }

    // Parse the form
    form.parseFromDOM();

    // Make sure values from form were copied into object.
    for (let name of expectedFields) {
        expect(form.obj[name]).toEqual(dpnProfile[name]);
    }

});
