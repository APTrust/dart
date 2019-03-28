const $ = require('jquery');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { Context } = require('../../core/context');
const { Job } = require('../../core/job');
const { JobMetadataController } = require('./job_metadata_controller');
const { PackageOperation } = require('../../core/package_operation');
const path = require('path');
const { TestUtil } = require('../../core/test_util');
const { UITestUtil } = require('../common/ui_test_util');
const { Util } = require('../../core/util');

beforeEach(() => {
    TestUtil.deleteJsonFile('Job');
});

afterAll(() => {
    TestUtil.deleteJsonFile('Job');
});

function getJobWithProfile() {
    var job = new Job();
    job.packageOp = new PackageOperation('TestBag', '/dev/null');
    var profilesDir = path.join(__dirname, '..', '..', 'test', 'profiles');
    job.bagItProfile = BagItProfile.load(path.join(profilesDir, 'multi_manifest.json'));
    job.save();
    return job;
}

function clearAllTagRequirements(tags) {
    for (let tag of tags) {
        tag.required = false;
        tag.emptyOk = true;
        tag.values = [];
    }
}

function getController() {
    let job = getJobWithProfile();
    let params = new URLSearchParams({ id: job.id });
    return new JobMetadataController(params);
}

function assertFormContainsAllTags(tags) {
    for (let tag of tags) {
        expect($(`#${tag.id}`).length).toEqual(1);
    }
}

function setAllFormValues(tags, prefix) {
    for (let tag of tags) {
        $(`#${tag.id}`).val(`${prefix}_${tag.tagName}`);
    }
}

function testFormValuesAreSaved(fnName) {
    let controller = getController();
    clearAllTagRequirements(controller.job.bagItProfile.tags);
    setAllFormValues(controller.job.bagItProfile.tags, 'ABC');
    if (fnName == 'next') {
        controller.next();
    } else if (fnName == 'back') {
        controller.back();
    } else {
        throw "Whatchu talkin' bout, Willis?"
    }
    let job = Job.find(controller.job.id);
    // Setting items with a list of allowed values is a little
    // harder. We can come back to this later if need be.
    let listItems = ['Access', 'Storage-Option', 'BagIt-Version',
                     'Tag-File-Character-Encoding']
    for (let tag of job.bagItProfile.tags) {
        if (!listItems.includes(tag.tagName)) {
            //console.log(`${tag.tagName} = ${tag.getValue()}`)
            expect(tag.getValue()).toMatch(/^ABC/);
        }
    }
}

test('constructor', () => {
    let job = getJobWithProfile();
    let params = new URLSearchParams({ id: job.id });
    let controller = new JobMetadataController(params);
    expect(controller.job).not.toBeNull();
    expect(controller.job.id).toEqual(job.id);
});

test('show', () => {
    let controller = getController();
    UITestUtil.setDocumentBody(controller.show())
    assertFormContainsAllTags(controller.job.bagItProfile.tags);
});

test('back', () => {
    let controller = getController();
    controller.job.save = jest.fn()

    let response = controller.back();
    expect(controller.job.save).toHaveBeenCalled();

    // Redirect has no content...
    expect(response).toEqual({});

    // ...and it should send us here
    expect(window.location.href).toMatch('#JobPackaging/show');
});

test('back saves form values', () => {
    testFormValuesAreSaved('back');
});

test('next does not move forward if tags are invalid', () => {
    let controller = getController();
    controller.job.save = jest.fn()

    let response = controller.next();

    expect(controller.job.save).toHaveBeenCalled();

    // Some tag values are missing, so the controller
    // should present the form with errors instead of
    // letting us move forward. Make sure the whole
    // form is still present.
    assertFormContainsAllTags(controller.job.bagItProfile.tags);

    // Spot check for presence of an error message.
    expect(response.container).toMatch(Context.y18n.__('This tag requires a value.'));
});

test('next does move forward if tags are valid', () => {
    let controller = getController();
    controller.job.save = jest.fn()

    // Alter tag definitions so none are required.
    // That lets us submit a valid empty form.
    clearAllTagRequirements(controller.job.bagItProfile.tags);

    let response = controller.next();
    expect(controller.job.save).toHaveBeenCalled();

    // Redirect has no content...
    expect(response).toEqual({});

    // ...and it should send us here
    expect(window.location.href).toMatch('#JobUpload/show');
});

test('next saves form values', () => {
    testFormValuesAreSaved('next');
});

test('newTag', () => {
    let controller = getController();
    UITestUtil.setDocumentBody(controller.newTag());
    expect($('#tagDefinitionForm_tagFile').length).toEqual(1);
    expect($('#tagDefinitionForm_tagName').length).toEqual(1);
    expect($('#tagDefinitionForm_userValue').length).toEqual(1);
});

test('saveNewTag rejects empty fields', () => {
    let controller = getController();
    let response = controller.saveNewTag();
    UITestUtil.setDocumentBody(response);
    expect($('#tagDefinitionForm_tagFile').length).toEqual(1);
    expect($('#tagDefinitionForm_tagName').length).toEqual(1);
    expect($('#tagDefinitionForm_userValue').length).toEqual(1);
    expect(response.modalContent).toMatch(Context.y18n.__('Please specify a tag file.'));
    expect(response.modalContent).toMatch(Context.y18n.__('Please specify a tag name.'));
    expect(response.modalContent).toMatch(Context.y18n.__('Please specify a value for this tag.'));
});

test('saveNewTag saves valid new tag', () => {
    let controller = getController();
    UITestUtil.setDocumentBody(controller.newTag());
    $('#tagDefinitionForm_tagFile').val('custom-tag-file.txt');
    $('#tagDefinitionForm_tagName').val('Custom-Tag');
    $('#tagDefinitionForm_userValue').val('Custom value');
    UITestUtil.setDocumentBody(controller.saveNewTag());

    let newTag = controller.job.bagItProfile.firstMatchingTag('tagName', 'Custom-Tag')
    expect(newTag).toBeDefined();
    expect(newTag).not.toBeNull();

    // Should show the full metadata form with all tags.
    assertFormContainsAllTags(controller.job.bagItProfile.tags);

    // Make sure the new tag was actually saved with the Job.
    let job = Job.find(controller.job.id);
    let savedTag = job.bagItProfile.firstMatchingTag('tagName', 'Custom-Tag')
    expect(savedTag).toBeDefined();
    expect(savedTag).not.toBeNull();
});

// Can't test this because of problems loading jQueryUI as an npm package.
//
// test('postRenderCallback for new tag form', () => {
//     let controller = getController();
//     UITestUtil.setDocumentBody(controller.newTag());
//     controller.postRenderCallback('newTag');
//     // TODO: Check this ->
//     // console.log($._data($('#tagDefinitionForm_tagFile'), "events"));
// });

test('postRenderCallback attaches toggle function to button on show()', () => {
    let controller = getController();
    UITestUtil.setDocumentBody(controller.show());
    controller.postRenderCallback('show');
    let toggleFunction = $._data($('#btnToggleHidden')[0], "events").click[0].handler;
    expect(typeof toggleFunction).toEqual('function');
});
