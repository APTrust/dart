const { BagItProfile } = require('../../bagit/bagit_profile');
const { BaseController } = require('./base_controller');
const { Context } = require('../../core/context');
const { Job } = require('../../core/job');
const { JobUploadForm } = require('../forms/job_upload_form');
const Templates = require('../common/templates');

/**
 * The JobUploadController presents the page that allows users
 * to define where a Job's files should be uploaded.
 *
 * @param {URLSearchParams} params - The URL search params parsed
 * from the URL used to reach this page. This should contain at
 * least the Job Id.
 *
 * @param {string} params.id - The id of the Job being worked
 * on. Job.id is a UUID string.
 */
class JobUploadController extends BaseController {

    constructor(params) {
        super(params, 'Jobs');
        this.model = Job;
        this.job = Job.find(this.params.get('id'));
    }

    /**
     * This displays a list of upload targets. The user can select
     * any number of them to receive this Job's files.
     */
    show() {
        let form = new JobUploadForm(this.job);
        let data = { job: this.job, form: form };
        return this.containerContent(Templates.jobUpload(data));
    }

    /**
     * This handles the Back button click, saving changes and sending
     * the user back to the metadata page (if this Job inlcudes bagging)
     * or the packaging page.
     */
    back() {
        let form = new JobUploadForm(this.job);
        form.copyFormValuesToJob(this.job);
        this.job.save();
        if (this.job.packageOp.packageFormat == 'BagIt') {
            return this.redirect('JobMetadata', 'show', this.params);
        }
        return this.redirect('JobPackaging', 'show', this.params);
    }

    /**
     * This handles the click on the Next button, sending the user
     * forward to a page where they can review and run the Job.
     */
    next() {
        let form = new JobUploadForm(this.job);
        form.copyFormValuesToJob(this.job);
        this.job.save();
        return this.redirect('JobRun', 'show', this.params);
    }

}

module.exports.JobUploadController = JobUploadController;
