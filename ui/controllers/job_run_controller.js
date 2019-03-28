const { BagItProfile } = require('../../bagit/bagit_profile');
const { BaseController } = require('./base_controller');
const { Context } = require('../../core/context');
const { Job } = require('../../core/job');
const Templates = require('../common/templates');
const { UploadTarget } = require('../../core/upload_target');

class JobRunController extends BaseController {

    constructor(params) {
        super(params, 'Jobs');
        this.model = Job;
        this.job = Job.find(this.params.get('id'));
    }

    show() {
        let uploadTargets = [];
        for (let op of this.job.uploadOps) {
            let target = UploadTarget.find(op.uploadTargetId);
            if (target) {
                uploadTargets.push(target.name);
            }
        }
        let data = { job: this.job, uploadTargets: uploadTargets }
        return this.containerContent(Templates.jobRun(data));
    }

    back() {
        this.job.save();
        if (this.job.packageOp.packageFormat == 'BagIt') {
            return this.redirect('JobMetadata', 'show', this.params);
        }
        return this.redirect('JobPackaging', 'show', this.params);
    }

    run() {
        // Grey this out while job is running.
        // Run job in separate process, so user can
        // navigate to other screens without disrupting it.
        alert("Here we go...");
    }

    postRenderCallback(fnName) {

    }
}

module.exports.JobRunController = JobRunController;
