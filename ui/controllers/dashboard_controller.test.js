const { DashboardController } = require('./dashboard_controller');
const { Job } = require('../../core/job');
const path = require('path');
const { RemoteRepository } = require('../../core/remote_repository');
const { TestUtil } = require('../../core/test_util');
const url = require('url');
const { Util } = require('../../core/util');


const params = new url.URLSearchParams();
const today = new Date().toISOString().split('T')[0];
const aptrustPluginId = 'c5a6b7db-5a5f-4ca5-a8f8-31b2e60c84bd';

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

function makeRepos(howMany) {
    let ids = [];
    for(let i=0; i < howMany; i++) {
        let repo = new RemoteRepository({
            name: `Test Repo ${i + 1}`,
            url: 'https://example.com',
            userId: 'marge@example.com',
            apiToken: '1234-5678',
            pluginId: aptrustPluginId
        })
        repo.save();
        ids.push(repo.id);
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
    let _ = makeJobs(4);
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

test('_getJobOutcomeAndTimestamp()', () => {
    let ids = makeJobs(1);
    let controller = new DashboardController(params);
    let job = Job.find(ids[0]);
    let expected = ['Validation failed', today];
    expect(controller._getJobOutcomeAndTimestamp(job)).toEqual(expected);
});

test('_getViableRepoClients()', () => {
    let ids = makeRepos(3);
    let controller = new DashboardController(params);
    let clients = controller._getViableRepoClients();
    expect(clients.length).toEqual(3);

    // Make one repo not viable by removing the apiToken.
    // APTrust client plugin says a repo without a token
    // is not viable because APTrust needs the token for
    // authorization.
    let repo1 = RemoteRepository.find(ids[0]);
    repo1.apiToken = '';
    repo1.save();
    expect(controller._getViableRepoClients().length).toEqual(2);

    // Make another repo not viable by removing its
    // pluginId. Without a pluginId, DART has no client
    // to connect to the repo.
    let repo2 = RemoteRepository.find(ids[1]);
    repo2.pluginId = '';
    repo2.save();
    expect(controller._getViableRepoClients().length).toEqual(1);
});

// test('_getRepoRows()', () => {

// });

// test('_getRepoReportDescriptions()', () => {

// });
