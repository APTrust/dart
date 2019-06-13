const { DashboardController } = require('./dashboard_controller');
const url = require('url');

const params = new url.URLSearchParams();

test('Constructor sets expected properties', () => {
    let controller = new DashboardController(params);
    expect(controller.navSection).toEqual("Dashboard");
});

// test('show()', () => {

// });

// test('_getRecentJobSummaries()', () => {

// });

// test('_getJobOutcomeAndTimestamp()', () => {

// });

// test('_getViableRepoClients()', () => {

// });

// test('_getRepoRows()', () => {

// });

// test('_getRepoReportDescriptions()', () => {

// });
