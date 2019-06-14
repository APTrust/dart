const { DashboardController } = require('./dashboard_controller');
const { Job } = require('../../core/job');
const path = require('path');
const { RemoteRepository } = require('../../core/remote_repository');
const { TestUtil } = require('../../core/test_util');
const url = require('url');
const { Util } = require('../../core/util');


const params = new url.URLSearchParams();
const today = new Date().toISOString().split('T')[0];

beforeEach(() => {

})

afterEach(() => {
    TestUtil.deleteJsonFile('Job');
    TestUtil.deleteJsonFile('RemoteRepository');
})

afterAll(() => {
    TestUtil.deleteJsonFile('Job');
    TestUtil.deleteJsonFile('RemoteRepository');
})

function makeJobs(howMany) {
    let pathToFile = path.join(__dirname, '..', '..', 'test', 'fixtures', 'Job_001.json');
    let ids = []; // id, createdAt
    for(let i=0; i < howMany; i++) {
        let job = Job.inflateFromFile(pathToFile);
        job.id = Util.uuid4();
        job.updatedAt = new Date().toISOString();
        job.save();
        ids.push(job.id)
    }
    return ids;
}

test('Constructor sets expected properties', () => {
    let controller = new DashboardController(params);
    expect(controller.navSection).toEqual("Dashboard");
});

// test('show()', () => {

// });

test('_getRecentJobSummaries()', () => {
    let ids = makeJobs(4);
    let controller = new DashboardController(params);
    let summaries = controller._getRecentJobSummaries();
    let sampleRecord = {
        name: 'BagOfPhotos',
        outcome: 'Validation failed',
        date: today
    }
    expect(summaries.length).toEqual(4);
    for (let summary of summaries) {
        expect(summary).toEqual(sampleRecord);
    }
});

// test('_getJobOutcomeAndTimestamp()', () => {

// });

// test('_getViableRepoClients()', () => {

// });

// test('_getRepoRows()', () => {

// });

// test('_getRepoReportDescriptions()', () => {

// });
