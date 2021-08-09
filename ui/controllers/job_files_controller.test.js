const $ = require('jquery');
const FileSystemReader = require('../../plugins/formats/read/file_system_reader');
const { Job } = require('../../core/job');
const { JobFilesController } = require('./job_files_controller');
const { PackageOperation } = require('../../core/package_operation');
const path = require('path');
const Templates = require('../common/templates');
const { TestUtil } = require('../../core/test_util');
const { UITestUtil } = require('../common/ui_test_util');

const sourceFiles = [
    path.resolve(path.join(__dirname, '..', '..', 'test', 'bags')),
    path.resolve(path.join(__dirname, '..', '..', 'test', 'fixtures')),
    path.resolve(path.join(__dirname, '..', '..', 'test', 'profiles', 'multi_manifest.json'))
];

const extraFile = path.resolve(path.join(__dirname, '..', '..', 'test', 'profiles', 'invalid_profile.json'));
const extraDir = path.resolve(path.join(__dirname, '..', '..', 'plugins'));

beforeEach(() => {
    TestUtil.deleteJsonFile('Job');
});

afterAll(() => {
    TestUtil.deleteJsonFile('Job');
});

function getJobWithFiles() {
    let job = new Job();
    job.packageOp = new PackageOperation('bag.tar', 'tmp/bag.tar');
    job.packageOp.sourceFiles = sourceFiles.slice();
    job.save();
    return Job.find(job.id);
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
    let params = new URLSearchParams({ id: job.id });
    let controller = new JobFilesController(params);
    expect(controller.job).toEqual(job);
});

test('postRenderCallback', () => {
    let job = getJobWithFiles();
    setHTML(job);
    let params = new URLSearchParams({ id: job.id });
    let controller = new JobFilesController(params);
    controller.postRenderCallback();
    let dropZoneEventListeners = $._data($('#dropZone')[0], "events");
    for (let event of ['dragover', 'dragend', 'dragleave', 'drop']) {
        expect(dropZoneEventListeners[event]).toBeDefined();
        expect(typeof dropZoneEventListeners[event][0].handler).toEqual('function');
    }
    let deleteListeners = $._data($('#filesTable')[0], "events");
    expect(deleteListeners).toBeDefined();
    expect(typeof deleteListeners.click[0].handler).toEqual('function');
    expect(deleteListeners.click[0].selector).toEqual('td.delete-file');
});

test('addItemsToUI()', done => {
    let job = getJobWithFiles();
    setHTML(job);
    let params = new URLSearchParams({ id: job.id });
    let controller = new JobFilesController(params);
    controller.postRenderCallback(); // this calls addItemsToUI() internally
    setTimeout(function() {
        let html = $('#filesPanel').html();
        for (let filepath of job.packageOp.sourceFiles) {
            expect(html).toContain(filepath);
        }

        // Make sure totals are updated.
        let dirCount = $('#totalDirCount');
        let fileCount = $('#totalFileCount');
        let byteCount = $('#totalByteCount');
        expect(parseInt(dirCount.text(), 10)).toBeGreaterThan(0);
        expect(parseInt(fileCount.text(), 10)).toBeGreaterThan(0);
        expect(byteCount.html()).toMatch(/K|MB/);
        expect(parseInt(byteCount.data('total'), 10)).toBeGreaterThan(0);

        // Make sure Job attrs are updated.
        expect(controller.job.dirCount).toBeGreaterThan(0);
        expect(controller.job.fileCount).toBeGreaterThan(0);
        expect(controller.job.byteCount).toBeGreaterThan(0);

        done();
    }, 400); // We have no event to wait for...
});

test('dropping a file adds it to the UI and job', done => {
    let job = getJobWithFiles();
    setHTML(job);
    let params = new URLSearchParams({ id: job.id });
    let controller = new JobFilesController(params);
    controller.postRenderCallback();
    let dropZoneEventListeners = $._data($('#dropZone')[0], "events");
    let dropEventHandler = dropZoneEventListeners.drop[0].handler;
    let mockEvent = {
        originalEvent: {
            dataTransfer: {
                files: [
                    { path: extraFile },
                    { path: extraDir }
                ]
            }
        },
        preventDefault: function() {},
        stopPropagation: function() {},
    }
    let allFiles = sourceFiles.concat([extraFile,extraDir]);
    // Call the handler
    dropEventHandler(mockEvent);

    // There's no event to listen for, so this is a hack.
    let timeout = 200;
    if (process.env.APPVEYOR || process.env.TRAVIS_OS_NAME) {
        timeout = 1000;
    }

    setTimeout(function() {
        // Reload to get changes, else it seems Jest caches this.
        job = Job.find(job.id);
        let html = $('#filesPanel').html();
        let rows = $('tr.filepath');
        let deleteCells = $('td.delete-file');

        // Make sure files were added to the UI.
        expect(rows.length).toEqual(allFiles.length);
        expect(deleteCells.length).toEqual(allFiles.length);
        for (let filepath of allFiles) {
            expect(html).toMatch(filepath);
        }

        // Make sure files were added to the job itself.
        expect(job.packageOp.sourceFiles.length).toEqual(allFiles.length);
        done();
    }, timeout);
});

test('deleting a file removes it from the UI and job', done => {
    let job = getJobWithFiles();
    setHTML(job);
    let params = new URLSearchParams({ id: job.id });
    let controller = new JobFilesController(params);
    controller.postRenderCallback();
    let deleteEventHandler = $._data($('#filesTable')[0], "events").click[0].handler;
    let mockEvent = {
        currentTarget: $('td.delete-file')
    }
    let pathToDelete = $('td.delete-file').data('filepath');
    deleteEventHandler(mockEvent);

    // There's no event to listen for, so this is a hack.
    let timeout = 200;
    if (process.env.APPVEYOR || process.env.TRAVIS_OS_NAME) {
        timeout = 1000;
    }

    setTimeout(function() {
        // Reload to get changes, else it seems Jest caches this.
        job = Job.find(job.id);
        let html = $('#filesPanel').html();
        let rows = $('tr.filepath');
        let deleteCells = $('td.delete-file');

        // Make sure file was removed from the UI.
        expect(rows.length).toEqual(2);
        expect(deleteCells.length).toEqual(2);
        expect(html).not.toMatch(pathToDelete);

        // Make sure file/dir was deleted from the job.
        // We started with 3, should now have two.
        expect(job.packageOp.sourceFiles.length).toEqual(2);
        done();
    }, timeout);
});

// https://github.com/APTrust/dart/issues/476
test('findContainingItem', () => {
    let job = new Job()
    job.packageOp = new PackageOperation('test', 'testy/test.tar')
    job.packageOp.sourceFiles = [
        __dirname,
        "D:/Baby Jan",
    ]
    let controller = new JobFilesController(new URLSearchParams())
    controller.job = job

    expect(controller.findContainingItem(path.join(__dirname, "photos", "image1"))).not.toBeNull()
    expect(controller.findContainingItem("D:/Baby Jan")).not.toBeNull()
    expect(controller.findContainingItem("D:/Baby Jan and Grandpa")).toBeNull()
});
