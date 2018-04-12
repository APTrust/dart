const fs = require('fs');
const { AppSetting } = require('../core/app_setting');
const { BagItProfile } = require('../core/bagit_profile');
const { Field } = require('../core/field');
const { Form } = require('../core/form');
const { Job } = require('../core/job');
const path = require('path');
const { TagDefinition } = require('../core/tag_definition');
const Templates = require('../core/templates');
const { Util } = require('../core/util');

// UI manager for the job_review.html template,
// where user reviews and runs a job.
class JobReview {

    constructor(job) {
        this.job = job;
    }

    initEvents() {
        // Remove previously attached events, or they'll fire twice.
        $("#btnJobStorage").off('click');
        $("#btnJobRun").off('click');
        $(document).off("click", "#btnRebuild");
        $(document).off("click", "#btnUpload");

        // Attach events.
        $("#btnJobStorage").on('click', this.onStorageClick());
        $("#btnJobRun").on('click', this.onRunClick());
        $(document).on("click", "#btnRebuild", this.onRebuildClick());
        $(document).on("click", "#btnUpload", this.onUploadClick());
    }

    // Go back to the Job Storage form.
    onStorageClick() {
        var self = this;
        return function() {
            var data = {};
            data.form = self.job.toStorageServiceForm();
            $("#container").html(es.Templates.jobStorage(data));
        }
    }

    // User clicks to run job.
    onRunClick() {
        var self = this;
        return function() {
            var mtime = self.job.packagedFileModtime();
            var hasProfile = self.job.bagItProfile != null;
            var needsUpload = (self.job.storageServices && self.job.storageServices.length > 0);
            // If job includes bagging and uploading, and we still
            // have a copy of the bag from a prior run, as the user
            // if they want to rebag or just upload the existing bag.
            if (hasProfile && needsUpload && mtime) {
                var data = {};
                data.bagName = self.job.bagName;
                data.timestamp = mtime.toLocaleDateString();
                $('#modalTitle').text(`Rebuild?`);
                $("#modalContent").html(Templates.uploadOrRebag(data));
                $('#modal').modal();
            } else {
                // No existing bag from prior run. Just run the job.
                self.job.run();
            }
        }
    }

    // User wants to rebuild existing bag before upload.
    onRebuildClick() {
        var self = this;
        return function() {
            $('#modal').modal('hide');
            self.job.run();
        }
    }

    // User wants to upload the bag that was built on a prior run.
    onUploadClick() {
        var self = this;
        return function() {
            $('#modal').modal('hide');
            self.job.uploadFiles();
            $('#jobPackage').hide();
        }
    }

}

module.exports.JobReview = JobReview;
