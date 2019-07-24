const $ = require('jquery');
const { AppSetting } = require('../../core/app_setting');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { BaseController } = require('./base_controller');
const { Constants } = require('../../core/constants');
const { Context } = require('../../core/context');
const { Job } = require('../../core/job');
const { JobPackageOpForm } = require('../forms/job_package_op_form');
const path = require('path');
const Templates = require('../common/templates');
const { Util } = require('../../core/util');

/**
 * The JobPackaingController presents the page that allows users
 * to define how a Job's files should be packaged.
 *
 * @param {URLSearchParams} params - The URL search params parsed
 * from the URL used to reach this page. This should contain at
 * least the Job Id.
 *
 * @param {string} params.id - The id of the Job being worked
 * on. Job.id is a UUID string.
 */
class JobPackagingController extends BaseController {

    constructor(params) {
        super(params, 'Jobs');
        this.model = Job;
        this.job = Job.find(this.params.get('id'));
    }

    /**
     * This displays a form where users can choose how this
     * Job's files should be packaged.
     */
    show() {
        let form = new JobPackageOpForm(this.job);
        return this._renderPackagingForm(form);
    }

    /**
     * This renders the form that allows users to choose how
     * this job's files should be packaged.
     */
    _renderPackagingForm(form) {
        let data = {
            job: this.job,
            form: form
        }
        let html = Templates.jobPackaging(data);
        return this.containerContent(html);
    }

    /**
     * This parses form input from the user and assigns the
     * values to the Job's {@link PackageOperation}.
     */
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
        let needsProfile = (this.job.bagItProfile == null && form.obj.bagItProfileId);
        let selectedProfileChanged = (this.job.bagItProfile && form.obj.bagItProfileId && form.obj.bagItProfileId != this.job.bagItProfile.id);
        let profileShouldBeRemoved = (this.job.bagItProfile && !form.obj.bagItProfileId)
        if (needsProfile || selectedProfileChanged) {
            this.job.bagItProfile = BagItProfile.find(form.obj.bagItProfileId);
        } else if (profileShouldBeRemoved) {
            this.job.bagItProfile = null;
        }
        return form;
    }

    /**
     * This saves changes to the Job's {@link PackageOperation},
     * optionally validating those changes first. If the withValidation
     * parameter is true and the changes are not valid, this will not
     * save the changes.
     *
     * @param {boolean} withValidation - If this is true, this method
     * will validate the user's changes before trying to save them, and
     * it will not save invalid changes. If false, this saves the users
     * changes without validating them.
     */
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

    /**
     * This handles the click on the Back button, sending the user
     * back to the Job files page.
     */
    back() {
        this._updatePackaging(false);
        return this.redirect('JobFiles', 'show', this.params);
    }

    /**
     * This handles the Next button click, sending the user forward to
     * the Job metadata page if the the Job includes a bagging step.
     * If the Job does not include bagging, this sends the user ahead
     * to the Job upload page.
     */
    next() {
        let form = this._updatePackaging(true);
        if (form.hasErrors()) {
            // Errors. Stay on packaging screen.
            form.setErrors();
            form._listPackageFormats();
            form._listBagItProfiles();
            return this._renderPackagingForm(form);
        }
        else if (this.job.packageOp.packageFormat == 'BagIt') {
            return this.redirect('JobMetadata', 'show', this.params);
        } else {
            return this.redirect('JobUpload', 'show', this.params);
        }
    }

    /**
     * The postRenderCallback attaches event handlers to elements
     * that this controller has just rendered.
     */
    postRenderCallback(fnName) {
        $("select[name=packageFormat]").change(this.onFormatChange());
        $("select[name=bagItProfileId]").change(this.onProfileChange());
        $('#jobPackageOpForm_packageName').on('keyup', this.onPackageNameKeyUp());
    }

    /**
     * This function loads a BagIt profile when the user selects one
     * from the list.
     */
    onProfileChange() {
        let controller = this;
        let updateOutputPath = this.onPackageNameKeyUp();
        return function() {
            var format = $("select[name=packageFormat]").val();
            var profileId = $("select[name=bagItProfileId]").val();
            if (!profileId || format != 'BagIt') {
                controller.job.bagItProfile = null;
            } else {
                controller.job.bagItProfile = BagItProfile.find(profileId);
            }
            updateOutputPath();
        }
    }


    /**
     * This function shows or hides a list of BagIt profiles, based
     * on whether this job includes a bagging step. For jobs that
     * include bagging, the user must speficy a BagIt profile.
     */
    onFormatChange() {
        let job = this.job;
        let updateOutputPath = this.onPackageNameKeyUp();
        return function() {
            var format = $("select[name=packageFormat]").val();
            if (format == 'BagIt') {
                $('#jobProfileContainer').show();
                let profileId = $("select[name=bagItProfileId]").val();
                job.bagItProfile = BagItProfile.find(profileId);
            } else {
                $('#jobProfileContainer').hide();
                job.bagItProfile = null;
            }
            updateOutputPath();
        }
    }

    /**
     * Returns a function that sets the output path to a sane value
     * when the user changes the package name. The bag will be written
     * to this output path.
     */
    onPackageNameKeyUp() {
        let controller = this;
        return function(e) {
            let baggingDir = AppSetting.firstMatching('name', 'Bagging Directory').value;
            let packageName = $('#jobPackageOpForm_packageName').val().trim();
            var format = $("select[name=packageFormat]").val();
            let extension = controller._getCalculatedFileExtension(format, controller.job.bagItProfile);
            if (packageName && !packageName.endsWith(extension)) {
                packageName += extension;
            }
            if (extension == '') {
                // If user switched a package format having a file extension
                // to one with no extension, strip the extension from the
                // output path.
                packageName = Util.bagNameFromPath(packageName);
            }
            $('#jobPackageOpForm_outputPath').val(path.join(baggingDir, packageName));
        }
    }

    /**
     * Returns the appropriate file extension for the specified
     * format. For example, ".tar".
     *
     * @params {string} format - The packaging format, which comes from
     * the format select list. E.g. BagIt, None, or the UUID of the
     * plugin that creates packages in that format.
     *
     * @params {BagItProfile} bagItProfile - The BagItProfile for the job,
     * or null if there is none. If this param is not null, this function
     * checks the profile's preferred serialization.
     *
     * @returns {string}
     */
    _getCalculatedFileExtension(format, bagItProfile) {
        let extension = '';
        if (format != 'BagIt' && format != 'None' && format != Constants.DIRECTORY_WRITER_UUID) {
            extension = $("select[name=packageFormat] option:selected").text();
        }
        if (bagItProfile) {
            extension = bagItProfile.preferredSerialization();
        }
        return extension;
    }
}

module.exports.JobPackagingController = JobPackagingController;
