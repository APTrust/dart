const { Job } = require('./job');
const { TestUtil } = require('./test_util');
const { Util } = require('./util');

afterEach(() => {
    TestUtil.deleteJsonFile('Job');
});

test('TestUtil.deleteJsonFile does not blow up when file is missing', () => {
    expect(() => { TestUtil.deleteJsonFile('non-existent-file') })
        .not.toThrow(Error);
});

test('loadProfile', () => {
    let profiles = {
        'invalid_profile.json': 'This profile is not valid.',
        'multi_manifest.json': 'Modified version of APTrust 2.2',
    };
    for (let [filename, desc] of Object.entries(profiles)) {
        let profile = TestUtil.loadProfile(filename);
        expect(profile).toBeDefined();
        expect(profile.description.startsWith(desc)).toEqual(true);
    }
});

test('loadProfilesFromSetup', () => {
    let aptrust = TestUtil.loadProfilesFromSetup('aptrust');
    expect(aptrust.length).toEqual(1);
    expect(aptrust[0].name).toEqual("APTrust");
    expect(aptrust[0].tags.length).toEqual(14);
    expect(function() {
        TestUti.loadProfilesFromSetup('dir_does_not_exist');
    }).toThrow();
});

test('ISODatePattern', () => {
    expect('2019-04-22T10:17:33.000Z').toMatch(TestUtil.ISODatePattern);
});

test('loadFixtures() with save = true', () => {
    let jobs = TestUtil.loadFixtures('Job_001', Job, true);
    expect(jobs.length).toEqual(1);
    expect(jobs[0].constructor.name).toEqual('Job');
    let jobId = jobs[0].id
    expect(Util.looksLikeUUID(jobId)).toBe(true);
    // Make sure it was saved
    let savedJob = Job.find(jobId);
    expect(savedJob).toBeTruthy();
    expect(savedJob.id).toEqual(jobId);
});

test('loadFixtures() with save = false', () => {
    let jobs = TestUtil.loadFixtures('Job_001', Job);
    expect(jobs.length).toEqual(1);
    expect(jobs[0].constructor.name).toEqual('Job');
    let jobId = jobs[0].id
    expect(Util.looksLikeUUID(jobId)).toBe(true);
    // Make sure it was NOT saved
    let savedJob = Job.find(jobId);
    expect(savedJob).not.toBeTruthy();
});

test('loadFixtures() with list of fixtures', () => {
    let list = ['Job_001', 'Job_002', 'Job_003'];
    let jobs = TestUtil.loadFixtures(list, Job);
    expect(jobs.length).toEqual(3);
    for (let job of jobs) {
        expect(job.constructor.name).toEqual('Job');
        expect(Util.looksLikeUUID(job.id)).toBe(true);
    }
});
