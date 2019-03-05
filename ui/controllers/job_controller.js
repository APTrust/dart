const { BaseController } = require('./base_controller');
const { Job } = require('../../core/job');
const { JobForm } = require('../forms/job_form');
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
        //this.formTemplate = Templates.jobForm;
        this.listTemplate = Templates.jobList;
        this.nameProperty = 'name';
        this.defaultOrderBy = 'createdAt';
        this.defaultSortDirection = 'desc';
    }

    new() {
        let job = new Job();
        job.save();
        this.params.set('id', job.id);
        console.log(job.id);
        return this.files();
    }

    files() {
        let job = Job.find(this.params.get('id'));
        let errors = '';  //this._getPageLevelErrors(profile);
        let data = {
            alertMessage: this.alertMessage,
            job: job
        }
        this.alertMessage = null;
        let html = Templates.jobFiles(data);
        return this.containerContent(html);
    }


    // update() {
    //     return this.containerContent('Update Job');
    // }

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

    // destroy() {
    //     return this.containerContent('Destroy Job');
    // }
}

module.exports.JobController = JobController;
