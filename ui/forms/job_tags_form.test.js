const { Job } = require('../../core/job');
const { JobTagsForm } = require('./job_tags_form');
const { TestUtil } = require('../../core/test_util');

function getJobWithBagItProfile() {
    let job = new Job();
    job.bagItProfile = TestUtil.loadProfile('aptrust_bagit_profile_2.2.json');
    return job;
}

test('create()', () => {
    let job = getJobWithBagItProfile();
    let form = new JobTagsForm(job);

    let fieldNames = Object.keys(form.fields);
    expect(fieldNames.length).toBeGreaterThan(1);
    expect(fieldNames.length).toEqual(job.bagItProfile.tags.length);

    for (let [name, field] of Object.entries(form.fields)) {
        let tag = job.bagItProfile.firstMatchingTag('id', field.id);
        expect(field.label).toContain(field.name);
        expect(field.label).toContain(':');
        if (tag.values) {
            // Plus one because the UI shows an empty first option.
            expect(field.choices.length).toEqual(tag.values.length + 1);
        }
        expect(field.value).toEqual(tag.getValue());
        expect(field.looksLikeDescriptionTag).toBeDefined();
        expect(field.wasAddedForJob).toBeDefined();
    }
})
