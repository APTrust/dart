const { Constants } = require('./constants');
const { Context } = require('./context');
const fs = require('fs');
const path = require('path');
const { TestUtil } = require('./test_util');
const tmp = require('tmp');
const { Workflow } = require('./workflow');
const { WorkflowBatch } = require('./workflow_batch');

const BadWorkflowId = '067eeeba-7192-41cc-a1fb-fdd210bdb826';
const GoodWorkflowId = 'abd9a873-c31a-4349-970d-e3abb4d62342';
const CSVFile = path.join(__dirname, '..', 'test', 'fixtures', 'batch_for_testing.csv')
const opts = {
    workflowId: GoodWorkflowId,
    pathToCSVFile: CSVFile,
}
var tempCSVFile = '';

beforeAll(() => {
    let badWorkflow = new Workflow();
    badWorkflow.id = BadWorkflowId;
    badWorkflow.save();

    TestUtil.loadFromProfilesDir('aptrust_2.2.json').save();
    let goodWorkflow = new Workflow({
        name: 'CSV Test Workflow',
        packageFormat: 'BagIt',
        packagePluginId: 'BagIt',
        bagItProfileId: Constants.BUILTIN_PROFILE_IDS['aptrust'],
    });
    goodWorkflow.id = GoodWorkflowId
    goodWorkflow.save();
});

afterAll(() => {
    TestUtil.deleteJsonFile('Workflow');
});

afterEach(() => {
    if (tempCSVFile != '' && fs.existsSync(tempCSVFile)) {
        fs.unlinkSync(tempCSVFile);
    }
});

// The CSV file has placeholder pathsin the Root-Directory column.
// Replace them with paths that point to DART source files.
function fixPaths() {
    let dartRoot = path.normalize(path.join(__dirname, '..'));

    let tmpfile = tmp.fileSync();
    tempCSVFile = tmpfile.name
    tmpfile.removeCallback();

    let csvData = fs.readFileSync(CSVFile, 'utf8');
    fs.writeFileSync(tempCSVFile, csvData.replace(/\/home\/dev\/dart/g, dartRoot))
}

// Delete some required tags from the CSV file.
function breakTags(fixPathsFirst) {
    let filePath = CSVFile;
    if (fixPathsFirst) {
        fixPaths()
        filePath = tempCSVFile
    }
    let csvData = fs.readFileSync(filePath, 'utf8');
    fs.writeFileSync(tempCSVFile, csvData.replace(/Institution/g, 'xyz'))
}

test('Constructor sets expected properties', () => {
    let batch = new WorkflowBatch(opts);
    expect(batch.workflowId).toEqual(opts.workflowId);
    expect(batch.pathToCSVFile).toEqual(opts.pathToCSVFile);
});

test('validateWorkflow()', () => {
    let batch = new WorkflowBatch(opts);
    expect(batch.validateWorkflow()).toEqual(true);

    batch.workflowId = BadWorkflowId;
    expect(batch.validateWorkflow()).toEqual(false);
    expect(batch.errors).toEqual({
        'name': Context.y18n.__('Name cannot be empty.'),
        'workflow': Context.y18n.__('Workflow has missing or invalid attributes'),
    });

    // Random UUID that does not exist.
    batch.workflowId = '791ace13-2610-411b-8a09-f5856ce7cfce';
    expect(batch.validateWorkflow()).toEqual(false);
    expect(batch.errors).toEqual({
        'name': Context.y18n.__('Name cannot be empty.'),
        'workflow': Context.y18n.__("DART cannot find the workflow you want to run."),
    });
});

test('validateCSVFile() with good paths', () => {
    // Fix paths in CSV file to point to DART source dir
    fixPaths();
    let batch = new WorkflowBatch({
        workflowId: GoodWorkflowId,
        pathToCSVFile: tempCSVFile,
    });
    expect(batch.validateCSVFile()).toEqual(true);
    expect(batch.errors).toEqual({});
});


test('validateCSVFile() with bad Access tag values', () => {
    // Replace Access tag values with invalid values.
    breakTags(true);
    let batch = new WorkflowBatch({
        workflowId: GoodWorkflowId,
        pathToCSVFile: tempCSVFile,
    });

    let expected = {
        "10-aptrust-info.txt/Access": "Value xyz for tag Access on line 10 is not in the list of allowed values.",
        "2-aptrust-info.txt/Access": "Value xyz for tag Access on line 2 is not in the list of allowed values.",
        "3-aptrust-info.txt/Access": "Value xyz for tag Access on line 3 is not in the list of allowed values.",
        "4-aptrust-info.txt/Access": "Value xyz for tag Access on line 4 is not in the list of allowed values.",
        "5-aptrust-info.txt/Access": "Value xyz for tag Access on line 5 is not in the list of allowed values.",
        "8-aptrust-info.txt/Access": "Value xyz for tag Access on line 8 is not in the list of allowed values.",
        "9-aptrust-info.txt/Access": "Value xyz for tag Access on line 9 is not in the list of allowed values.",
    }

    expect(batch.validateCSVFile()).toEqual(false);
    expect(batch.errors).toEqual(expected);
});


test('validateCSVFile() with bad paths', () => {
    let expectedErrors =     {
        "/home/dev/dart/bagit": "Line 2: path does not exist: /home/dev/dart/bagit",
        "/home/dev/dart/core": "Line 3: path does not exist: /home/dev/dart/core",
        "/home/dev/dart/migrations": "Line 4: path does not exist: /home/dev/dart/migrations",
        "/home/dev/dart/plugins": "Line 5: path does not exist: /home/dev/dart/plugins",
        "/home/dev/dart/profiles": "Line 6: path does not exist: /home/dev/dart/profiles",
        "/home/dev/dart/settings": "Line 7: path does not exist: /home/dev/dart/settings",
        "/home/dev/dart/ui": "Line 8: path does not exist: /home/dev/dart/ui",
        "/home/dev/dart/util": "Line 9: path does not exist: /home/dev/dart/util",
        "/home/dev/dart/workers": "Line 10: path does not exist: /home/dev/dart/workers",
    }
    let batch = new WorkflowBatch(opts);
    expect(batch.validateCSVFile()).toEqual(false);
    expect(batch.errors).toEqual(expectedErrors);
});

test('validate() good', () => {
    fixPaths();
    let batch = new WorkflowBatch({
        workflowId: GoodWorkflowId,
        pathToCSVFile: tempCSVFile,
    });
    expect(batch.validate()).toEqual(true);
    expect(Object.keys(batch.errors).length).toEqual(0);
});

test('validate() bad', () => {
    breakTags(false);
    let batch = new WorkflowBatch({
        workflowId: GoodWorkflowId,
        pathToCSVFile: tempCSVFile,
    });

    // Should get 7 bad tag value errors and 9 bad paths
    expect(batch.validate()).toEqual(false);
    expect(Object.keys(batch.errors).length).toEqual(16);
});
