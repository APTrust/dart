const { Constants } = require('../core/constants');
const fs = require('fs');
const path = require('path');
const { TestUtil } = require('../core/test_util');
const tmp = require('tmp');
const { Workflow } = require('../core/workflow');
const { WorkflowBatch } = require('../core/workflow_batch');

class BatchTestUtil {

    constructor() {
        this.badWorkflowId = '067eeeba-7192-41cc-a1fb-fdd210bdb826';
        this.goodWorkflowId = 'abd9a873-c31a-4349-970d-e3abb4d62342';
        this.csvFile = path.join(__dirname, '..', 'test', 'fixtures', 'batch_for_testing.csv')
        this.batchOpts = {
            workflowId: this.goodWorkflowId,
            pathToCSVFile: this.csvFile,
        }
        this.tempCSVFile = '';
    }

    saveGoodAndBadWorkflows() {
        let badWorkflow = new Workflow();
        badWorkflow.id = this.badWorkflowId;
        badWorkflow.save();

        TestUtil.loadFromProfilesDir('aptrust_2.2.json').save();
        let goodWorkflow = new Workflow({
            name: 'CSV Test Workflow',
            packageFormat: 'BagIt',
            packagePluginId: 'BagIt',
            bagItProfileId: Constants.BUILTIN_PROFILE_IDS['aptrust'],
        });
        goodWorkflow.id = this.goodWorkflowId
        goodWorkflow.save();
    }

    // The CSV file has placeholder pathsin the Root-Directory column.
    // Replace them with paths that point to DART source files.
    fixPaths() {
        let dartRoot = path.normalize(path.join(__dirname, '..'));

        let tmpfile = tmp.fileSync();
        this.tempCSVFile = tmpfile.name
        tmpfile.removeCallback();

        let csvData = fs.readFileSync(this.csvFile, 'utf8');
        fs.writeFileSync(this.tempCSVFile, csvData.replace(/\/home\/dev\/dart/g, dartRoot))
    }

    // Delete some required tags from the CSV file.
    breakTags(fixPathsFirst) {
        let filePath = this.csvFile;
        if (fixPathsFirst) {
            this.fixPaths()
            filePath = this.tempCSVFile
        }
        let csvData = fs.readFileSync(filePath, 'utf8');
        fs.writeFileSync(this.tempCSVFile, csvData.replace(/Institution/g, 'xyz'))
    }


}

module.exports.BatchTestUtil = BatchTestUtil;
