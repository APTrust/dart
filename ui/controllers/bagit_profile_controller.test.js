const $ = require('jquery');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { BagItProfileController, BagItProfileControllerTypeMap } = require('./bagit_profile_controller');
const { BagItProfileForm } = require('../forms/bagit_profile_form');
const { Constants } = require('../../core/constants');
const Templates = require('../common/templates');
const { TestUtil } = require('../../core/test_util');
const { UITestUtil } = require('../common/ui_test_util');
const url = require('url');

const params = new url.URLSearchParams({
    limit: '10',
    offset: '0',
    orderBy: 'name',
    sortDirection: 'desc',
    id: Constants.BUILTIN_PROFILE_IDS['aptrust']
});

function preloadProfiles() {
    let aptProfile = TestUtil.loadProfile('aptrust_bagit_profile_2.2.json');
    let dpnProfile = TestUtil.loadProfile('dpn_bagit_profile_2.1.json');
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

});

test('update()', () => {

});

test('_getPageHTML()', () => {

});

test('_getPageLevelErrors()', () => {

});

test('getNewProfileFromBase()', () => {

});

test('newTagFile()', () => {

});

test('newTagFileCreate()', () => {

});
