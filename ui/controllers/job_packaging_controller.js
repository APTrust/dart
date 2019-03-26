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

class JobPackagingController extends BaseController {

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
        let form = new JobPackageOpForm(this.job);
        let data = {
            job: this.job,
            form: form
        }
        let html = Templates.jobPackaging(data);
        return this.containerContent(html);
    }

    _parseJobPackagingForm() {
        let form = new JobPackageOpForm(this.job);
        form.parseFromDOM();
        this.job.packageOp.packageFormat = form.obj.packageFormat;
        this.job.packageOp.pluginId = form.obj.pluginId;
        this.job.packageOp.outputPath = form.obj.outputPath;
        this.job.packageOp.packageName = form.obj.packageName;

        // Load the BagIt Profile only if necessary. If the user is
        // moving backwards through the form, the profile may already
        // be saved with custom values. We don't want to overwrite it
        // by reloading it.
        let needsProfile = this.job.bagItProfile == null && form.obj.bagItProfileId;
        let selectedProfileChanged = this.job.bagItProfile && form.obj.bagItProfileId && form.obj.bagItProfileId != this.job.bagItProfile.id;
        if (needsProfile || selectedProfileChanged) {
            this.job.bagItProfile = BagItProfile.find(form.obj.bagItProfileId);
        }
        return form;
    }

    _updatePackaging(withValidation) {
        let form = this._parseJobPackagingForm();
        if (withValidation) {
            if (this.job.packageOp.packageFormat == 'BagIt' && !this.job.bagItProfile) {
                form.obj.errors['bagItProfileId'] = Context.y18n.__("When choosing BagIt format, you must choose a BagIt profile.");
            }
            if (!this.job.packageOp.outputPath) {
                form.obj.errors['outputPath'] = Context.y18n.__("You must specify an output path.");
            }
            if (!this.job.packageOp.packageName) {
                form.obj.errors['packageName'] = Context.y18n.__("You must specify a package name.");
            }
            // TODO: Validate bag name.
        }
        if(!withValidation || (withValidation && !form.hasErrors())) {
            this.job.save();
        }
        return form
    }


    // User clicked Back button from packaging page.
    // Save work without validating.
    backToFiles() {
        this._updatePackaging(false);
        return this.redirect('JobFiles', 'show', this.params);
    }

    // User clicked Next button from packaging page.
    postPackaging() {
        let form = this._updatePackaging(true);
        if (form.hasErrors()) {
            // Errors. Stay on packaging screen.
            form.setErrors();
            form._listPackageFormats();
            form._listBagItProfiles();
            return this._renderPackagingForm(this.job, form);
        }
        else if (this.job.packageOp.packageFormat == 'BagIt') {
            return this.showMetadataForm(this.job);
        } else {
            return this.showUploadForm(this.job);
        }
    }


    postRenderCallback(fnName) {
        $("select[name=packageFormat]").change(this.onFormatChange());
    }

    onFormatChange() {
        return function() {
            var format = $("select[name=packageFormat]").val();
            if (format == 'BagIt') {
                $('#jobProfileContainer').show();
            } else {
                $('#jobProfileContainer').hide();
            }
        }
    }
}

module.exports.JobPackagingController = JobPackagingController;
