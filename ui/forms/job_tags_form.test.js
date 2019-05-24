const $ = require('jquery');
const { Choice } = require('./choice');
const { Job } = require('../../core/job');
const { JobTagsForm } = require('./job_tags_form');
const Templates = require('../common/templates');
const { TestUtil } = require('../../core/test_util');

function getJobWithBagItProfile() {
    let job = new Job();
    job.bagItProfile = TestUtil.loadProfilesFromSetup('aptrust')[0];
    return job;
}

test('create()', () => {
    let job = getJobWithBagItProfile();
    let form = new JobTagsForm(job);

    let fieldIds = Object.keys(form.fields);
    expect(fieldIds.length).toBeGreaterThan(1);
    expect(fieldIds.length).toEqual(job.bagItProfile.tags.length);

    for (let [name, field] of Object.entries(form.fields)) {
        let tag = job.bagItProfile.firstMatchingTag('id', field.id);
        expect(field.label).toContain(tag.tagName);
        expect(field.label).toContain(':');
        expect(field.label).toContain(tag.tagFile);
        if (tag.values && tag.values.length > 0) {
            // Plus one because the UI shows an empty first option.
            expect(field.choices.length).toEqual(tag.values.length + 1);
        }
        expect(field.value).toEqual(tag.getValue());
        expect(field.looksLikeDescriptionTag).toBeDefined();
        expect(field.wasAddedForJob).toBeDefined();
    }
})

test('parse and copy', () => {
    let job = getJobWithBagItProfile();
    let form = new JobTagsForm(job);

    let titleTag = job.bagItProfile.getTagsFromFile('aptrust-info.txt', 'Title');
    form.fields[titleTag[0].id].value = 'Bag Title';

    let internalIdTag = job.bagItProfile.getTagsFromFile('bag-info.txt', 'Internal-Sender-Identifier');
    form.fields[internalIdTag[0].id].value = 'xyz-999';

    let accessTag = job.bagItProfile.getTagsFromFile('aptrust-info.txt', 'Access');
    for (let op of form.fields[accessTag[0].id].choices) {
        if (op.value == 'Institution') {
            op.selected = true;
        }
    }

    // Render the form to the page.
    document.body.innerHTML = Templates.jobMetadata({ job: job, form: form});

    let expectedFormObj = {
        errors: {},
        '39b8ac8a-8e3d-47c3-9cda-5edd0d4ad1fb': '0.97',
        '2a914ea2-ee3b-4c53-96e1-4f93f641338b': 'UTF-8',
        '567451b6-1f30-4bda-b66b-9a657426d5e5': '',
        '117e46d8-096f-41f1-8c94-7d9202b9477b': '',
        '41b75504-e54d-49a1-aad4-c8a4921d15ce': '',
        '4d9e682c-4236-4adf-aaf2-c9d7666e3062': '',
        '32e69005-4495-452f-8b3d-bef545fca583': '',
        '917fc560-5bd1-4a5b-acb6-b7a4ce749252': '',
        '018c0706-5597-4406-a705-205c608d827f': 'xyz-999',
        'de2c8f3e-fadb-4811-88a2-83aafa44fb50': '',
        '9b7344ae-9d06-4444-9d8a-dda7e5c2b8dc': 'Bag Title',
        '60ef466a-6d9c-4825-92cf-e472fb05f3d4': 'Institution',
        'd94d1d47-49cb-4569-8d27-d9ebbf25c9b2': '',
        '53075007-e6cf-4a18-9b34-caa605ed593f': 'Standard'
    };

    // This calls parseFromDOM internally
    form.copyFormValuesToTags(job);

    // Make sure we parsed what we expected to parse.
    expect(form.obj).toEqual(expectedFormObj);

    titleTag = job.bagItProfile.getTagsFromFile('aptrust-info.txt', 'Title');
    internalIdTag = job.bagItProfile.getTagsFromFile('bag-info.txt', 'Internal-Sender-Identifier');
    accessTag = job.bagItProfile.getTagsFromFile('aptrust-info.txt', 'Access');

    expect(titleTag[0].userValue).toEqual('Bag Title');
    expect(internalIdTag[0].userValue).toEqual('xyz-999');
    expect(accessTag[0].userValue).toEqual('Institution');
});
