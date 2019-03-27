const { BagItProfile } = require('../../bagit/bagit_profile');
const { BaseController } = require('./base_controller');
const { Context } = require('../../core/context');
const { Job } = require('../../core/job');
const Templates = require('../common/templates');

class JobRunController extends BaseController {

    constructor(params) {
        super(params, 'Jobs');
        this.model = Job;
        this.job = Job.find(this.params.get('id'));
    }

    show() {
        //let form = new JobRunForm(this.job);
        //let data = { job: this.job, form: form };
        let data = { job: this.job }
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
