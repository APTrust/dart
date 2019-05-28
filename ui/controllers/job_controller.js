const { BagItProfile } = require('../../bagit/bagit_profile');
const { BaseController } = require('./base_controller');
const { Context } = require('../../core/context');
const dateFormat = require('dateformat');
const { Job } = require('../../core/job');
const Templates = require('../common/templates');

const typeMap = {
    limit: 'number',
    offset: 'number',
}

/**
 * The JobController handles processing to list all jobs
 * and create new jobs. The process of defining which files
 * are part of Job, how files should be packaged, and where
 * the should be uploaded are handled by other controllers.
 *
 * @param {URLSearchParams} params - The URL search params parsed
 * from the URL used to reach this page. This should contain at
 * least the Job Id.
 *
 * @param {string} params.id - The id of the Job being worked
 * on. Job.id is a UUID string.
 */
class JobController extends BaseController {

    constructor(params) {
        super(params, 'Jobs');
        this.typeMap = typeMap;

        this.model = Job;
        this.listTemplate = Templates.jobList;
        this.nameProperty = 'title';
        this.defaultOrderBy = 'createdAt';
        this.defaultSortDirection = 'desc';
    }

    /**
     * This method creates a new Job.
     */
    new() {
        let job = new Job();
        job.save();
        this.params.set('id', job.id);
        return this.redirect('JobFiles', 'show', this.params);
    }


    /**
     * Lists all Jobs in the local Jobs database.
     */
    list() {
        let listParams = this.paramsToHash();
        listParams.orderBy = listParams.sortBy || this.defaultOrderBy;
        listParams.sortDirection = listParams.sortOrder || this.defaultSortDirection;
        let jobs = Job.list(null, listParams);
        this.colorCodeJobs(jobs);
        let data = {
            alertMessage: this.alertMessage,
            items: jobs
        };
        let html = this.listTemplate(data);
        return this.containerContent(html);
    }

    /**
     * This adds some custom display properties to each jobs hash
     * so we can color-code the display.
     */
    colorCodeJobs(jobs) {
        for(let i=0; i < jobs.length; i++) {
            let job = Job.inflateFrom(jobs[i]);
            job.pkgDate = '-';
            job.valDate = '-';
            job.uploadDate = '-';
            if (job.packageAttempted()) {
                job.pkgColor = (job.packageSucceeded() ? 'text-success' : 'text-danger');
                job.pkgDate = `${dateFormat(job.packagedAt(), 'shortDate')} ${dateFormat(job.packagedAt(), 'shortTime')}`;
            }
            if (job.validationAttempted()) {
                job.valColor = (job.validationSucceeded() ? 'text-success' : 'text-danger');
                job.valDate = `${dateFormat(job.validatedAt(), 'shortDate')} ${dateFormat(job.validatedAt(), 'shortTime')}`;
            }
            if (job.uploadAttempted()) {
                job.uploadColor = (job.uploadSucceeded() ? 'text-success' : 'text-danger');
                job.uploadDate = `${dateFormat(job.uploadedAt(), 'shortDate')} ${dateFormat(job.uploadedAt(), 'shortTime')}`;
            }
            jobs[i] = job;
        }
    }

}

module.exports.JobController = JobController;
