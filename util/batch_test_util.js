const { AppSetting } = require('../core/app_setting');
const { Constants } = require('../core/constants');
const fs = require('fs');
const mkdirp = require('mkdirp');
const os = require('os');
const path = require('path');
const { TestUtil } = require('../core/test_util');
const tmp = require('tmp');
const { Workflow } = require('../core/workflow');

class BatchTestUtil {

    constructor() {
        this.noNameWorkflowId = '7bf8398d-3bc2-4484-a9b7-2c791c5fbf9f';
        this.emptyWorkflowId = '067eeeba-7192-41cc-a1fb-fdd210bdb826';
        this.goodWorkflowId = 'abd9a873-c31a-4349-970d-e3abb4d62342';
        this.csvFile = path.join(__dirname, '..', 'test', 'fixtures', 'batch_for_testing.csv')
        this.batchOpts = {
            workflowId: this.goodWorkflowId,
            pathToCSVFile: this.csvFile,
        }
        this.tempCSVFile = '';
    }

    saveGoodAndBadWorkflows() {
        let noNameWorkflow = new Workflow();
        noNameWorkflow.id = this.noNameWorkflowId
        noNameWorkflow.bagItProfileId = Constants.BUILTIN_PROFILE_IDS['empty'];
        noNameWorkflow.skipBagCreation = false;
        noNameWorkflow.save();

        let emptyWorkflow = new Workflow();
        emptyWorkflow.id = this.emptyWorkflowId;
        emptyWorkflow.name = 'Invalid Workflow for Batch Testing';
        emptyWorkflow.skipBagCreation = false;
        emptyWorkflow.save();

        TestUtil.loadFromProfilesDir('aptrust_2.2.json').save();
        let goodWorkflow = new Workflow({
            name: 'CSV Test Workflow',
            packageFormat: 'BagIt',
            packagePluginId: 'BagIt',
            bagItProfileId: Constants.BUILTIN_PROFILE_IDS['aptrust'],
        });
        goodWorkflow.id = this.goodWorkflowId
        goodWorkflow.skipBagCreation = false
        goodWorkflow.save();
    }

    // This is required if one of our tests is going to make a bag.
    createBaggingDirectory() {
        this.baggingTempDir = path.join(os.tmpdir(), 'dart-bagger-test');
        if (!fs.existsSync(this.baggingTempDir)) {
            mkdirp.sync(this.baggingTempDir, { mode: 0o755 });
        }
        let setting = new AppSetting({
            name: 'Bagging Directory',
            value: this.baggingTempDir,
        });
        setting.save();
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
