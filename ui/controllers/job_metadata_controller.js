const { BagItProfile } = require('../../bagit/bagit_profile');
const { BaseController } = require('./base_controller');
const { Context } = require('../../core/context');
const { Job } = require('../../core/job');
const { JobFilesController } = require('./job_files_controller');
//const { JobMetadataUIHelper } = require('../common/job_metadata_ui_helper');
const { JobPackagingUIHelper } = require('../common/job_packaging_ui_helper');
const { JobForm } = require('../forms/job_form');
const { JobPackageOpForm } = require('../forms/job_package_op_form');
const { JobTagsForm } = require('../forms/job_tags_form');
const Templates = require('../common/templates');

const typeMap = {
    limit: 'number',
    offset: 'number',
}

class JobMetadataController extends BaseController {

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
        let form = new JobTagsForm(this.job);
        let data = { job: this.job, form: form };
        return this.containerContent(Templates.jobMetadata(data));
    }

    back() {
        this._parseMetadataForm();
        this.job.save();
        return this.redirect('JobPackaging', 'show', this.params);
    }

    next() {
        let tagsAreValid = this._validateMetadataForm();
        this.job.save();
        if(!tagsAreValid) {
            return this.show();
        }
        return this.redirect('JobUpload', 'show', this.params);
    }

    _parseMetadataForm() {
        let form = new JobTagsForm(this.job);
        form.copyFormValuesToTags(this.job);
    }

    _validateMetadataForm() {
        this._parseMetadataForm();
        let isValid = true;
        for (let t of this.job.bagItProfile.tags) {
            if (!t.validateForJob()) {
                isValid = false;
            }
        }
        return isValid;
    }

    postRenderCallback(fnName) {
        $("#btnToggleHidden").click(function() {
            let showAll = Context.y18n.__('Show All Tags');
            let hideDefaults = Context.y18n.__('Hide Default Tags');
            let currentText = $("#btnToggleHidden").text().trim();
            $('.form-group-hidden').toggle();
            if (currentText == showAll) {
                $("#btnToggleHidden").text(hideDefaults);
            } else {
                $("#btnToggleHidden").text(showAll);
            }
        });

        $("#btnAddNewTag").click(function() {
            alert('This feature is coming soon.');
        });
    }
}

module.exports.JobMetadataController = JobMetadataController;
