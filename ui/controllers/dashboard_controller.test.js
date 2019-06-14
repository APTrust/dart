const $ = require('jquery');
const { DashboardController } = require('./dashboard_controller');
const { Job } = require('../../core/job');
const path = require('path');
const { RemoteRepository } = require('../../core/remote_repository');
const { TestUtil } = require('../../core/test_util');
const url = require('url');
const { UITestUtil } = require('../common/ui_test_util');
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

test('show()', () => {
    // This mock is not working. Hmm...
    //
    // // Mock the APTrust client.
    // const { APTrustClient } = require('../../plugins/repository/aptrust');
    // const mockRecentIngests = jest.fn(() => {
    //     return new Promise(function(resolve, reject) {
    //         resolve('10 ingests');
    //     })
    // });
    // const mockRecentWorkItems = jest.fn(() => {
    //     return new Promise(function(resolve, reject) {
    //         resolve('10 ingests');
    //     })
    // });
    // jest.mock('../../plugins/repository/aptrust', () => {
    //     return jest.fn().mockImplementation(() => {
    //         return {
    //             recentIngests: mockRecentIngests,
    //             recentWorkItems: mockRecentWorkItems
    //         };
    //     });
    // });

    let jobIds = makeJobs(4);
    let repoIds = makeRepos(2);
    let controller = new DashboardController(params);
    UITestUtil.setDocumentBody(controller.show());
    controller.postRenderCallback();

    let containerHTML = $('#container').html();

    // Look for expect output about recent jobs.
    expect(containerHTML).toMatch('BagOfPhotos');
    expect(containerHTML).toMatch('Validation failed');

    // TODO: Test for info about running jobs.

    // Look for expected divs to hold remote repo content.
    expect(containerHTML).toMatch('id="APTrustClient_1_1"');
    expect(containerHTML).toMatch('id="APTrustClient_1_2"');
    expect(containerHTML).toMatch('id="APTrustClient_2_1"');
    expect(containerHTML).toMatch('id="APTrustClient_2_2"');
});

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

test('_getRepoReportDescriptions()', () => {
    let ids = makeRepos(3);
    let controller = new DashboardController(params);
    let clients = controller._getViableRepoClients();
    let descriptions = controller._getRepoReportDescriptions(clients);

    // We have 3 viable clients with 2 descriptions each.
    expect(descriptions.length).toEqual(6);
    for (let desc of descriptions) {
        expect(desc.id.length).toBeGreaterThan(4);
        expect(desc.title.length).toBeGreaterThan(4);
        expect(desc.description.length).toBeGreaterThan(4);
        expect(typeof desc.method).toEqual('function');
    }
});

test('_getRepoRows()', () => {
    let ids = makeRepos(3);
    let controller = new DashboardController(params);
    let clients = controller._getViableRepoClients();
    let descriptions = controller._getRepoReportDescriptions(clients);
    let rows = controller._getRepoRows(descriptions);
    expect(rows.length).toEqual(3);
    for(let row of rows) {
        expect(row.length).toEqual(2);
        for (let record of row) {
            expect(record.id.length).toBeGreaterThan(4);
            expect(record.title.length).toBeGreaterThan(4);
            expect(record.description.length).toBeGreaterThan(4);
            expect(typeof record.method).toEqual('function');
        }
    }
});
