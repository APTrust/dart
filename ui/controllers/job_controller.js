//////////////////////////////////////////////////////////
//    TODO: DELETE AFTER REFACTORING JOBS CONTROLLER    //
//////////////////////////////////////////////////////////

const { BagItProfile } = require('../../bagit/bagit_profile');
const { BaseController } = require('./base_controller');
const { Context } = require('../../core/context');
const { Job } = require('../../core/job');
const { JobFilesController } = require('./job_files_controller');
const { JobMetadataUIHelper } = require('../common/job_metadata_ui_helper');
const { JobPackagingUIHelper } = require('../common/job_packaging_ui_helper');
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
        //this.formTemplate = Templates.jobForm;
        this.listTemplate = Templates.jobList;
        this.nameProperty = 'name';
        this.defaultOrderBy = 'createdAt';
        this.defaultSortDirection = 'desc';

        this._postRenderHelper = null;
    }

    new() {
        let job = new Job();
        job.save();
        this.params.set('id', job.id);
        //return this.files();
        return this.redirect('JobFiles', 'show', this.params);
    }

    files() {
        let job = Job.find(this.params.get('id'));
        //this._postRenderHelper = new JobFileUIHelper(job);
        let data = {
            alertMessage: this.alertMessage,
            job: job
        }
        this.alertMessage = null;
        let html = Templates.jobFiles(data);
        return this.containerContent(html);
    }

    packaging() {
        let job = Job.find(this.params.get('id'));
        this._postRenderHelper = new JobPackagingUIHelper(job);
        let form = new JobPackageOpForm(job);
        return this._renderPackagingForm(job, form);
    }

    backToPackaging() {
        let job = this._parseMetadataForm();
        job.save();
        return this.packaging();
    }

    _renderPackagingForm(job, form) {
        let data = {
            job: job,
            form: form
        }
        let html = Templates.jobPackaging(data);
        return this.containerContent(html);
    }

    _parseJobPackagingForm() {
        let job = Job.find(this.params.get('id'));
        let form = new JobPackageOpForm(job);
        form.parseFromDOM();
        job.packageOp.packageFormat = form.obj.packageFormat;
        job.packageOp.pluginId = form.obj.pluginId;
        job.packageOp.outputPath = form.obj.outputPath;
        job.packageOp.packageName = form.obj.packageName;

        // Load the BagIt Profile only if necessary. If the user is
        // moving backwards through the form, the profile may already
        // be saved with custom values. We don't want to overwrite it
        // by reloading it.
        let needsProfile = job.bagItProfile == null && form.obj.bagItProfileId;
        let selectedProfileChanged = job.bagItProfile && form.obj.bagItProfileId && form.obj.bagItProfileId != job.bagItProfile.id;
        if (needsProfile || selectedProfileChanged) {
            job.bagItProfile = BagItProfile.find(form.obj.bagItProfileId);
        }
        return [job, form]
    }

    _updatePackaging(withValidation) {
        let [job, form] = this._parseJobPackagingForm();
        if (withValidation) {
            if (job.packageOp.packageFormat == 'BagIt' && !job.bagItProfile) {
                form.obj.errors['bagItProfileId'] = Context.y18n.__("When choosing BagIt format, you must choose a BagIt profile.");
            }
            if (!job.packageOp.outputPath) {
                form.obj.errors['outputPath'] = Context.y18n.__("You must specify an output path.");
            }
            if (!job.packageOp.packageName) {
                form.obj.errors['packageName'] = Context.y18n.__("You must specify a package name.");
            }
            // TODO: Validate bag name.
        }
        if(!withValidation || (withValidation && !form.hasErrors())) {
            job.save();
        }
        return [job, form]
    }


    // User clicked Back button from packaging page.
    // Save work without validating.
    backToFiles() {
        this._updatePackaging(false);
        //return this.files();
        return this.redirect('JobFiles', 'show', this.params);
    }

    // User clicked Next button from packaging page.
    postPackaging() {
        let [job, form] = this._updatePackaging(true);
        if (form.hasErrors()) {
            // Errors. Stay on packaging screen.
            form.setErrors();
            form._listPackageFormats();
            form._listBagItProfiles();
            return this._renderPackagingForm(job, form);
        }
        else if (job.packageOp.packageFormat == 'BagIt') {
            return this.showMetadataForm(job);
        } else {
            return this.showUploadForm(job);
        }
    }

    showMetadataForm(job) {
        let form = new JobTagsForm(job);
        this._postRenderHelper = new JobMetadataUIHelper(job);
        return this.containerContent(Templates.jobMetadata(
            {
                job: job,
                form: form
            }
        ));
    }

    _parseMetadataForm() {
        let job = Job.find(this.params.get('id'));
        let form = new JobTagsForm(job);
        form.copyFormValuesToTags(job);
        return job;
    }

    _validateMetadataForm() {
        var job = this._parseMetadataForm();
        let isValid = true;
        for (let t of job.bagItProfile.tags) {
            if (!t.validateForJob()) {
                isValid = false;
            }
        }
        return [job, isValid];
    }

    // This is too messy and confusing and needs to be refactored.
    // job can come from too many different places. It should be clear.
    showUploadForm(job) {
        if (this.params.get('referer') == 'MetadataForm') {
            let formIsValid = true;
            [job, formIsValid] = this._validateMetadataForm();
            job.save();
            if (!formIsValid) {
                return this.showMetadataForm(job);
            }
        }
        return this.containerContent(Templates.jobUpload({ job: job }));
    }


    backFromUpload() {
        let job = Job.find(this.params.get('id'));
        // TODO: Validate upload form
        if (job.packageOp.packageFormat == 'BagIt') {
            return this.showMetadataForm(job);
        } else {
            return this.packaging(job);
        }
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

    // TODO: Remove if not used
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

    postRenderCallback(fnName) {
        if (this._postRenderHelper) {
            this._postRenderHelper.initUI();
        }
    }
}

module.exports.JobController = JobController;
