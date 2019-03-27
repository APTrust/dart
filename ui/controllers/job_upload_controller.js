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

class JobUploadController extends BaseController {

    constructor(params) {
        super(params, 'Jobs');
        this.typeMap = typeMap;
        this.model = Job;
        this.listTemplate = Templates.jobList;
        this.nameProperty = 'name';
        this.defaultOrderBy = 'createdAt';
        this.defaultSortDirection = 'desc';
        this.job = Job.find(this.params.get('id'));
    }


    show() {
        //let form = new JobUploadForm(this.job);
        //let data = { job: this.job, form: form };
        let data = { job: this.job }
        return this.containerContent(Templates.jobUpload(data));
    }

    back() {
        this.job.save();
        if (this.job.packageOp.packageFormat == 'BagIt') {
            return this.redirect('JobMetadata', 'show', this.params);
        }
        return this.redirect('JobPackaging', 'show', this.params);
    }

    next() {
        // this.job.save();
        // if(!this._validateUploadForm()) {
        //     return this.show(job);
        // }
        // return this.redirect('JobUpload', 'show', this.params);
    }

    postRenderCallback(fnName) {

    }
}

module.exports.JobUploadController = JobUploadController;
