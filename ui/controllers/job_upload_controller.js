const { BaseController } = require('./base_controller');
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
        let data = { 
            job: this.job, 
            form: form,
            workflowName: this.job.workflowName
        };
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
        if (this.job.skipPackaging) {
            // This is an upload-only or validate and upload job.
            // These usually come from workflows.
            return this.redirect('JobFiles', 'show', this.params);
        }
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
        this.setUploadSourceFiles();
        this.job.save();
        return this.redirect('JobRun', 'show', this.params);
    }

    /**
     * If this is a non-packaging job, i.e. an upload-only or validate
     * and upload only job, we need to make sure the upload operation 
     * includes whatever files the user dragged into the drag-and-drop
     * files list. 
     */
    setUploadSourceFiles() {
        let job = this.job
        let hasPackageOpSources = (job.packageOp != null && job.packageOp.sourceFiles.length > 0)
        let hasEmptyUploadOps = (job.uploadOps.length > 0 && job.uploadOps[0].sourceFiles.length == 0)
        if (job.skipPackaging && hasPackageOpSources && hasEmptyUploadOps) {
            job.uploadOps.forEach(op => op.sourceFiles = job.packageOp.sourceFiles)
        }
    }
}

module.exports.JobUploadController = JobUploadController;
