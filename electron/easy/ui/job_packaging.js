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

// UI manager for the job_packaging.html template,
// where user chooses how a job should be packaged.
class JobPackaging {

    constructor(job) {
        this.job = job;
    }

    initEvents() {
        $("select[name=packageFormat]").change(this.onFormatChange());
        $("select[name=profile]").change(this.onProfileChange());
        $(".suggest-name").click(this.onSuggestClick());
        $("#btnJobFiles").click(this.onJobFilesClick());
        $("#btnJobTagsOrStorage").click(this.onNextButtonClick());
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

    onProfileChange() {
        var self = this;
        return function() {
            self.hideBagNameHint();
            var bagNameOnForm = $('#bagName').val();
            var id = $("select[name=profile]").val();
            if (id == "") {
                self.job.bagItProfile = null;
                $('#bagName').val("");
            } else {
                self.job.bagItProfile = BagItProfile.find(id);
                var name = $('#bagName').val() || self.job.bagItProfile.bagName;
                if (!self.job.bagItProfile.isValidBagName(name)) {
                    self.job.bagName = self.job.bagItProfile.suggestBagName();
                    $('#bagName').val(self.job.bagName);
                }
                self.showBagNameHint();
            }
        }
    }

    onSuggestClick() {
        var self = this;
        return function() {
            var bagName = '';
            if (self.job.bagItProfile != null) {
                bagName = self.job.bagItProfile.suggestBagName();
            } else {
                bagName = BagItProfile.suggestGenericBagName();
            }
            self.job.bagName = bagName;
            $('#bagName').val(bagName);
        }
    }

    onJobFilesClick() {
        var self = this;
        return function() {
            self.job.bagName = $('#bagName').val();
            self.job.baggingDirectory = $('#baggingDirectory').val();
            self.job.save();
            $("#container").html(Templates.jobFiles());
        }
    }

    onNextButtonClick() {
        var self = this;
        return function() {
            self.job.bagName = $('#bagName').val();
            self.job.packageFormat = $('#packageFormat').val();
            self.job.baggingDirectory = $('#baggingDirectory').val();
            if (!self.validateProfilePresence()) {
                return
            }
            if (self.job.bagItProfile != null && !self.validateBagName()) {
                return
            }
            if (self.job.bagItProfile != null && !self.validateBaggingDirectory()) {
                return
            }
            self.job.save();
            if (self.job.bagItProfile == null) {
                // Show storage options
                self.goToJobStorage();
            } else {
                // Show tag editor
                $("#container").html(Templates.jobTags(self.job.dataForTagEditor()));
            }
        }
    }

    validateProfilePresence() {
        var profile = $('#profile').val();
        var parent = $('#profile').closest("div.form-group");
        if (this.job.packageFormat == "BagIt" && this.job.bagItProfile == null) {
            parent.removeClass("has-success");
            parent.addClass("has-error");
            $('#profileError').text("Select a BagIt profile.")
            return false;
        } else {
            parent.removeClass("has-error");
            parent.addClass("has-success");
            $('#profileError').text("")
            return true;
        }
    }

    validateBagName() {
        var name = $('#bagName').val();
        var parent = $('#bagName').closest("div.form-group");
        if (this.job.bagItProfile != null) {
            if (this.job.bagItProfile.isValidBagName(name)) {
                parent.removeClass("has-error");
                parent.addClass("has-success");
                this.hideBagNameHint();
                this.job.bagName = name;
            } else {
                parent.removeClass("has-success");
                parent.addClass("has-error");
                this.showBagNameHint();
                return false;
            }
        } else if (!BagItProfile.nameLooksLegal(name)) {
            parent.removeClass("has-success");
            parent.addClass("has-error");
            this.showBagNameHint();
            return false;
        }
        return true;
    }

    validateBaggingDirectory() {
        var isValid = true;
        var dir = $('#baggingDirectory').val();
        var parent = $('#baggingDirectory').closest("div.form-group");
        if (this.job.bagItProfile != null && !dir) {
            parent.removeClass("has-success");
            parent.addClass("has-error");
            isValid = false;
        } else {
            parent.removeClass("has-error");
            parent.addClass("has-success");
        }
        return isValid;
    }

    showBagNameHint() {
        if (this.job.bagItProfile == null) {
            $('#nameHintGeneric').show();
        } else if (this.job.bagItProfile.hasRequiredTagFile("aptrust-info.txt")) {
            $('#nameHintAPTrust').show();
        } else if (this.job.bagItProfile.hasRequiredTagFile("dpn-tags/dpn-info.txt")) {
            $('#nameHintDPN').show();
        }
    }

    hideBagNameHint() {
        $('#nameHintAPTrust').hide();
        $('#nameHintDPN').hide();
        $('#nameHintGeneric').hide();
    }

    goToJobStorage() {
        var data = {};
        data.bagOrFiles = "bag";
        if (this.job.bagItProfile == null) {
            data.bagOrFiles = "files";
        }
        data.form = this.job.toStorageServiceForm();
        $("#container").html(Templates.jobStorage(data));
    }

}

module.exports.JobPackaging = JobPackaging;
