const fs = require('fs');
const { Job } = require('../core/job');
const path = require('path');
const { StorageService } = require('../core/storage_service');
const Templates = require('../core/templates');
const { Util } = require('../core/util');

// UI manager for the job_storage.html template,
// where user specifies where to send job files.
class JobStorage {

    constructor(job) {
        this.job = job;
    }

    initEvents() {
        var self = this;
        $("#btnJobReview").click(function() {
            self.setStorageServicesFromForm();
            self.job.save();
            var data = {};
            data['job'] = self.job;
            data['storageServices'] = self.job.storageServices;
            if (self.job.bagItProfile != null) {
                data['bagTitle'] = self.job.bagItProfile.bagTitle();
                data['bagDescription'] = self.job.bagItProfile.bagDescription();
                data['bagInternalIdentifier'] = self.job.bagItProfile.bagInternalIdentifier();
            }
            $("#container").html(Templates.jobReview(data));
        });

        $("#btnPrevious").click(function() {
            self.setStorageServicesFromForm();
            self.job.save();
            var data = {};
            if (self.job.bagItProfile != null) {
                $("#container").html(Templates.jobTags(self.job.dataForTagEditor()));
            } else {
                data.form = self.job.toPackagingForm();
                data.domainName = AppSetting.findByName("Institution Domain").value;
                data.showProfileList = data.form.fields.packageFormat.getSelected() == "BagIt";
                $("#container").html(Templates.jobPackaging(data));
            }
        });
    }

    setStorageServicesFromForm() {
        this.job.storageServices = [];
        for (var input of $("input[name=storageServices]:checked")) {
            var service = StorageService.find($(input).val());
            this.job.storageServices.push(service);
        }
    }

}

module.exports.JobStorage = JobStorage;
