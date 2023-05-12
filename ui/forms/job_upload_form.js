const $ = require('jquery');
const { Choice } = require('./choice');
const { Constants } = require('../../core/constants');
const { Context } = require('../../core/context');
const { Form } = require('./form');
const { StorageService } = require('../../core/storage_service');
const { UploadOperation } = require('../../core/upload_operation');

/**
 * JobUploadForm allows the user to specify where Job
 * files will be uploaded.
 */
class JobUploadForm extends Form {

    constructor(job) {
        let listOptions = {
            orderBy: 'name',
            sortDirection: 'asc'
        }
        let filterFn = function(ss) { return ss.allowsUpload };
        let data = {
            uploadTargets: StorageService.list(filterFn, listOptions)
        }
        super('JobUpload', data);
        this.allTargets = data.uploadTargets;
        this._init(job);
    }

    _init(job) {
        let selectedTargets = job.uploadOps.map(op => op.storageServiceId).filter(id => id != '');
        this.fields['uploadTargets'].choices = Choice.makeList(
            this.allTargets,
            selectedTargets,
            false
        );
        this._initField('deleteBagAfterUpload', job.deleteBagAfterUpload)
        this.fields['deleteBagAfterUpload'].choices = Choice.makeList(
            Constants.YES_NO,
            job.deleteBagAfterUpload,
            false);
        this.fields['deleteBagAfterUpload'].label = Context.y18n.__("Delete local copy of bag after upload?")
    }

    copyFormValuesToJob(job) {
        //this.parseFromDOM();
        this.obj.uploadTargets = $('input[name="uploadTargets"]:checked').each(cb => $(cb).value).get().map(cb => cb.value)
        // This is a problem, because it deletes the upload result
        // along with the upload target. Hmm...
        job.uploadOps = [];
        for (let targetId of this.obj.uploadTargets) {
            let op = new UploadOperation();
            op.storageServiceId = targetId;
            job.uploadOps.push(op);
        }
        job.deleteBagAfterUpload = ($('#jobUploadForm_deleteBagAfterUpload').val() == 'Yes')
    }
}

module.exports.JobUploadForm = JobUploadForm;
