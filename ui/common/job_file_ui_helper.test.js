const $ = require('jquery');
const FileSystemReader = require('../../plugins/formats/read/file_system_reader');
const { Job } = require('../../core/job');
const { JobFileUIHelper } = require('./job_file_ui_helper');
const { PackageOperation } = require('../../core/package_operation');
const path = require('path');
const Templates = require('../common/templates');
const { UITestUtil } = require('../common/ui_test_util');

const sourceFiles = [
    path.resolve(path.join(__dirname, '..', '..', 'test', 'bags')),
    path.resolve(path.join(__dirname, '..', '..', 'test', 'fixtures')),
    path.resolve(path.join(__dirname, '..', '..', 'test', 'profiles', 'multi_manifest.json'))
];

const extraFile = path.resolve(path.join(__dirname, '..', '..', 'test', 'profiles', 'invalid_profile.json'));
const extraDir = path.resolve(path.join(__dirname, '..', '..', 'plugins'));

function getJobWithFiles() {
    let job = new Job();
    job.packageOp = new PackageOperation('bag.tar', 'tmp/bag.tar');
    job.packageOp.sourceFiles = sourceFiles.slice();
    return job;
}

function setHTML(job) {
    let html = Templates.jobFiles({ job: job })
    let response = {
        nav: Templates.nav({ section: 'Job' }),
        container: html
    }
    UITestUtil.setDocumentBody(response);
}

test('constructor', () => {
    let job = getJobWithFiles();
    let helper = new JobFileUIHelper(job);
    expect(helper.job).toEqual(job);
});

test('initUI', () => {
    let job = getJobWithFiles();
    setHTML(job);
    let helper = new JobFileUIHelper(job);
    helper.initUI();
    dropZoneEventListeners = $._data($('#dropZone')[0], "events");
    for (let event of ['dragover', 'dragend', 'dragleave', 'drop']) {
        expect(dropZoneEventListeners[event]).toBeDefined();
        expect(typeof dropZoneEventListeners[event][0].handler).toEqual('function');
    }
    deleteListeners = $._data($('#filesTable')[0], "events");
    expect(deleteListeners).toBeDefined();
    expect(typeof deleteListeners.click[0].handler).toEqual('function');
    expect(deleteListeners.click[0].selector).toEqual('td.delete-file');
});

test('addItemsToUI()', done => {
    let job = getJobWithFiles();
    setHTML(job);
    let helper = new JobFileUIHelper(job);
    helper.initUI(); // this calls addItemsToUI() internally
    setTimeout(function() {
        let html = $('#filesPanel').html();
        for (let filepath of job.packageOp.sourceFiles) {
            expect(html).toContain(filepath);
        }
        let dirCount = $('#totalDirCount');
        let fileCount = $('#totalFileCount');
        let byteCount = $('#totalByteCount');
        expect(parseInt(dirCount.text(), 10)).toBeGreaterThan(0);
        expect(parseInt(fileCount.text(), 10)).toBeGreaterThan(0);
        expect(byteCount.html()).toMatch(/K|MB/);
        expect(parseInt(byteCount.data('total'), 10)).toBeGreaterThan(0);
        done();
    }, 200);
});

// test('addRow() adds row and updates totals', () => {

// });
