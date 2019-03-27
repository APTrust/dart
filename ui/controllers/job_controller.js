const { BagItProfile } = require('../../bagit/bagit_profile');
const { BaseController } = require('./base_controller');
const { Context } = require('../../core/context');
const { Job } = require('../../core/job');
const { JobFilesController } = require('./job_files_controller');
const { JobForm } = require('../forms/job_form');
const { JobPackageOpForm } = require('../forms/job_package_op_form');
const { JobTagsForm } = require('../forms/job_tags_form');
const Templates = require('../common/templates');

const typeMap = {
    limit: 'number',
    offset: 'number',
}

class JobController extends BaseController {

    constructor(params) {
        super(params, 'Jobs');
        this.typeMap = typeMap;

        this.model = Job;
        this.formClass = JobForm;
        this.listTemplate = Templates.jobList;
        this.nameProperty = 'name';
        this.defaultOrderBy = 'createdAt';
        this.defaultSortDirection = 'desc';
    }

    new() {
        let job = new Job();
        job.save();
        this.params.set('id', job.id);
        return this.redirect('JobFiles', 'show', this.params);
    }


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
                job.pkgDate = dateFormat(job.packagedAt(), 'shortDate');
            }
            if (job.validationAttempted()) {
                job.valColor = (job.validateSucceeded() ? 'text-success' : 'text-danger');
                job.valDate = dateFormat(job.validatedAt(), 'shortDate');
            }
            if (job.uploadAttempted()) {
                job.uploadColor = (job.uploadSucceeded() ? 'text-success' : 'text-danger');
                job.uploadDate = dateFormat(job.uploadedAt(), 'shortDate');
            }
            jobs[i] = job;
        }
    }

}

module.exports.JobController = JobController;
