const $ = require('jquery');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { BagItProfileController, BagItProfileControllerTypeMap } = require('./bagit_profile_controller');
const { BagItProfileForm } = require('../forms/bagit_profile_form');
const { Constants } = require('../../core/constants');
const { Context } = require('../../core/context');
const fs = require('fs');
const path = require('path');
const Templates = require('../common/templates');
const { TestUtil } = require('../../core/test_util');
const { UITestUtil } = require('../common/ui_test_util');
const url = require('url');


// This is necessary because the tests that import BagIt Profiles
// below (_importWithErrHandling) actually save the profiles to
// the local test DB.
afterAll(() => {
    TestUtil.deleteJsonFile('BagItProfile');
});

const params = new url.URLSearchParams({
    limit: '10',
    offset: '0',
    orderBy: 'name',
    sortDirection: 'desc',
    id: Constants.BUILTIN_PROFILE_IDS['aptrust']
});

const propsNotOnForm = [
    'errors',
    'help',
    'type',
    'required',
    'userCanDelete',
    'baseProfileId',
    'isBuiltIn'
];

const infoFields = [
    'infoContactEmail',
    'infoContactName',
    'infoExternalDescription',
    'infoIdentifier',
    'infoSourceOrganization',
    'infoVersion'
];

function preloadProfiles() {
    let aptProfile = TestUtil.loadFromProfilesDir('aptrust_2.2.json');
    let dpnProfile = TestUtil.loadFromProfilesDir('dpn.json');
    let invalidProfile = TestUtil.loadProfile('invalid_profile.json');
    aptProfile.save();
    dpnProfile.save();
    invalidProfile.save();
}

beforeEach(() => {
    preloadProfiles();
});

afterEach(() => {
    TestUtil.deleteJsonFile('BagItProfile');
});

test('Constructor sets expected properties', () => {
    let controller = new BagItProfileController(params);
    expect(controller.params).toEqual(params);
    expect(controller.typeMap).toEqual(BagItProfileControllerTypeMap);
    expect(controller.alertMessage).toBeNull();
    expect(controller.model).toEqual(BagItProfile);
    expect(controller.formClass).toEqual(BagItProfileForm);
    expect(controller.formTemplate).toEqual(Templates.bagItProfileForm);
    expect(controller.listTemplate).toEqual(Templates.bagItProfileList);
    expect(controller.nameProperty).toEqual("name");
    expect(controller.defaultOrderBy).toEqual("name");
    expect(controller.defaultSortDirection).toEqual("asc");
});

test('new()', () => {
    let controller = new BagItProfileController(params);
    UITestUtil.setDocumentBody(controller.new());

    // Make sure the select list shows all existing profiles,
    // plus a slot for an empty "from scratch" profile.
    let baseProfileSelectList = $('#bagItProfileForm_baseProfile');
    expect(baseProfileSelectList.length).toEqual(1);
    expect(baseProfileSelectList.find('option').length).toEqual(4);

    // Make sure the nav bar is present
    expect($('#nav').length).toEqual(1);

    // Make sure Save button is present
    expect($('a[href="#BagItProfile/create"]').length).toEqual(1);

    // List link appears in nav and in Cancel button.
    expect($('a[href="#BagItProfile/list"]').length).toEqual(2);
});

test('create() with base profile', () => {
    let dpnProfile = BagItProfile.find(Constants.BUILTIN_PROFILE_IDS['dpn']);
    let controller = new BagItProfileController(params);
    UITestUtil.setDocumentBody(controller.new());
    $('#bagItProfileForm_baseProfile').val(Constants.BUILTIN_PROFILE_IDS['dpn']);
    UITestUtil.setDocumentBody(controller.create());

    // Make sure a new profile was created with DPN as the base profile.
    let profile = BagItProfile.firstMatching('name', 'Copy of DPN');
    expect(profile).toBeDefined();
    expect(profile.baseProfileId).toEqual(Constants.BUILTIN_PROFILE_IDS['dpn']);
    expect(profile.id).not.toEqual(Constants.BUILTIN_PROFILE_IDS['dpn']);

    for (let property of Object.keys(profile)) {
        if (['id', 'name', 'description', 'isBuiltIn', 'baseProfileId'].includes(property)) {
            continue;
        }
        expect(profile[property]).toEqual(dpnProfile[property]);
    }

    // Spot check one element to make sure the edit form is visible.
    expect($('#bagItProfileForm_acceptSerialization').length).toEqual(1);
});

test('create() without base profile', () => {
    let controller = new BagItProfileController(params);
    UITestUtil.setDocumentBody(controller.new());
    UITestUtil.setDocumentBody(controller.create());

    // Make sure a new profile was created with DPN as the base profile.
    let profile = BagItProfile.firstMatching('name', 'New BagIt Profile');
    expect(profile).toBeDefined();
    expect(profile.baseProfileId).toBeNull();

    expect($('#bagItProfileForm_name').val()).toEqual('New BagIt Profile');
    expect($('#bagItProfileForm_description').val()).toEqual('New custom BagIt profile');
});

test('edit()', () => {
    params.set('id', Constants.BUILTIN_PROFILE_IDS['aptrust']);
    let controller = new BagItProfileController(params);
    UITestUtil.setDocumentBody(controller.edit());

    // Basic sanity check to show we loaded the right profile.
    expect($('#bagItProfileForm_id').val()).toEqual(Constants.BUILTIN_PROFILE_IDS['aptrust']);
    expect($('#bagItProfileForm_name').val()).toEqual('APTrust');
    expect($('#bagItProfileForm_description').val()).toEqual('APTrust 2.2 default BagIt profile.');

    // Make sure expected form elements are present
    let profile = BagItProfile.find(Constants.BUILTIN_PROFILE_IDS['aptrust']);
    ensureBasicFormElements(profile);

    // Make sure all tag files appear.
    expect($('div[data-tag-file-name="bagit.txt"]').length).toEqual(1);
    expect($('div[data-tag-file-name="bag-info.txt"]').length).toEqual(1);
    expect($('div[data-tag-file-name="aptrust-info.txt"]').length).toEqual(1);
});

test('update() with valid profile', () => {
    params.set('id', Constants.BUILTIN_PROFILE_IDS['aptrust']);
    let controller = new BagItProfileController(params);
    // Need to render edit first, because update reads the rendered form.
    UITestUtil.setDocumentBody(controller.edit());
    UITestUtil.setDocumentBody(controller.update());
    expect($('div.alert.alert-success').length).toEqual(1);
});

test('update() with invalid profile', () => {
    let profile = new BagItProfile();
    profile.name = '';
    profile.acceptBagItVersion = [];
    profile.manifestsRequired = [];
    profile.manifestsAllowed = [];
    profile.serialization = 'required';
    profile.acceptSerialization = [];
    profile.tags = [];
    profile.save();
    params.set('id', profile.id);
    let controller = new BagItProfileController(params);
    UITestUtil.setDocumentBody(controller.edit());
    UITestUtil.setDocumentBody(controller.update());

    // Make sure expected form elements are present
    ensureBasicFormElements(profile);

    expect($('div.alert.alert-danger').length).toEqual(1);
    let errItems = $('div.alert.alert-danger').html();
    expect(errItems.includes(Context.y18n.__('About Tab'))).toBe(true);
    expect(errItems.includes(Context.y18n.__('General Tab'))).toBe(true);
    expect(errItems.includes(Context.y18n.__('Manifests Tab'))).toBe(true);
    expect(errItems.includes(Context.y18n.__('Serialization Tab'))).toBe(true);
    expect(errItems.includes(Context.y18n.__('Tag Files Tab'))).toBe(true);
});

test('newTagFile()', () => {
    params.set('id', Constants.BUILTIN_PROFILE_IDS['aptrust']);
    let controller = new BagItProfileController(params);
    UITestUtil.setDocumentBody(controller.newTagFile());
    expect($('#tagFileForm_tagFileName').length).toEqual(1);
});

test('newTagFileCreate()', () => {
    let profile = new BagItProfile()
    profile.save();
    params.set('id', profile.id);
    let controller = new BagItProfileController(params);

    // Show the form and set the new tag file name
    UITestUtil.setDocumentBody(controller.newTagFile());
    $('#tagFileForm_tagFileName').val('unit-test-tag-file.txt');

    // Parse the form and create the tag file
    UITestUtil.setDocumentBody(controller.newTagFileCreate());

    // We should see the edit form...
    ensureBasicFormElements(profile);

    // Make sure new tag file is in the UI.
    expect($('div[data-tag-file-name="unit-test-tag-file.txt"]').length).toEqual(1);

    // Make sure new tag file is part of the saved profile.
    let savedProfile = BagItProfile.find(profile.id);
    expect(savedProfile.hasTagFile('unit-test-tag-file.txt')).toBe(true);
    expect(savedProfile.getTagsFromFile('unit-test-tag-file.txt', 'New-Tag').length).toEqual(1);
});

test('deleteTagDef()', () => {
    let profile = new BagItProfile()
    profile.save();
    params.set('id', profile.id);
    let controller = new BagItProfileController(params);

    // Load the edit view...
    UITestUtil.setDocumentBody(controller.edit());

    // Simulate 'yes' click on confirmation dialog.
    window.confirm = jest.fn(() => true)

    let versionTag = profile.firstMatchingTag('tagName', 'BagIt-Version');
    let encodingTag = profile.firstMatchingTag('tagName', 'Tag-File-Character-Encoding');

    // Make sure the tags appear in the UI
    expect($(`tr[data-tag-id="${versionTag.id}"]`).length).toEqual(1);
    expect($(`tr[data-tag-id="${encodingTag.id}"]`).length).toEqual(1);

    // Delete the versionTag, and then make sure it's no longer in the UI.
    controller.params.set('tagDefId', versionTag.id);
    controller.deleteTagDef();
    expect($(`tr[data-tag-id="${versionTag.id}"]`).length).toEqual(0);

    // Delete the encodingTag, and then make sure it's no longer in the UI.
    // We have to reset the document body here, because deleting the last
    // tag from a tag file redirects to the edit() view.
    controller.params.set('tagDefId', encodingTag.id);
    UITestUtil.setDocumentBody(controller.deleteTagDef());
    expect($(`tr[data-tag-id="${encodingTag.id}"]`).length).toEqual(0);

    // There should also be an alert that says the tag file was deleted.
    let message = Context.y18n.__(
        "Deleted tag %s and tag file %s",
        encodingTag.tagName,
        encodingTag.tagFile);
    expect($('div.alert.alert-success').length).toEqual(1);
    expect($('div.alert.alert-success').html().includes(message)).toBe(true);
});

test('_importWithErrHandling() - GitHub', () => {
    let jsonFile = path.join(__dirname, '..', '..', 'test', 'profiles', 'bagit_profiles_github', 'bagProfileBar.json');
    let json = fs.readFileSync(jsonFile);
    let controller = new BagItProfileController(params);
    expect(controller._importWithErrHandling(json, 'https://so.me/url')).toBe(true);
});

test('_importWithErrHandling() - LOC', () => {
    let jsonFile = path.join(__dirname, '..', '..', 'test', 'profiles', 'loc', 'SANC-state-profile.json');
    let json = fs.readFileSync(jsonFile);
    let controller = new BagItProfileController(params);
    expect(controller._importWithErrHandling(json, 'https://so.me/url')).toBe(true);
});

test('_importWithErrHandling() - Bad JSON', () => {
    let json = "This is bad JSON and cannot be parsed";
    let controller = new BagItProfileController(params);

    jest.spyOn(window, 'alert').mockImplementation(() => {});
    expect(controller._importWithErrHandling(json, 'https://so.me/url')).toBe(false);
    expect(window.alert).toHaveBeenCalled();
});

function ensureBasicFormElements(profile) {
    for (let property of Object.keys(profile)) {
        if (propsNotOnForm.includes(property)) {
            continue;
        }
        if (['string', 'number', 'boolean'].includes(typeof profile[property])) {
            let formElementId = `#bagItProfileForm_${property}`;
            expect($(formElementId).length).toEqual(1);
        }
    }
    for (let fieldName of infoFields) {
        let formElementId = `#bagItProfileForm_${fieldName}`;
        expect($(formElementId).length).toEqual(1);
    }
}
