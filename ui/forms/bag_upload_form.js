const $ = require('jquery');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { Choice } = require('./choice');
const { Constants } = require('../../core/constants');
const { Context } = require('../../core/context');
const { Field } = require('./field');
const { Form } = require('./form');
const { Job } = require('../../core/job');
const path = require('path');
const { StorageService } = require('../../core/storage_service');
const { UploadOperation } = require('../../core/upload_operation');

/**
 * BagUploadForm can present and parse the form that allows
 * the user to specify a bag to be uploaded to a storage service.
 */
class BagUploadForm extends Form {

    constructor(job) {
        let listOptions = {
            orderBy: 'name',
            sortDirection: 'asc'
        }
        let filterFn = function(ss) { return ss.allowsUpload };
        let data = {
            uploadTargets: StorageService.list(filterFn, listOptions)
        }
        super('Job', data);
        this.allTargets = data.uploadTargets;
        this._init(job);        
    }

    _init(job) {
        this.fields['pathToBag'] = new Field("pathToBag", "pathToBag", "Choose a file...", "");
        let selectedTargets = job.uploadOps.map(op => op.storageServiceId).filter(id => id != '');
        this.fields['uploadTargets'].choices = Choice.makeList(
            this.allTargets,
            selectedTargets,
            false
        );
    }

    parseFromDOM() {
        // This is required for jest tests.
        if ($ === undefined) {
            var $ = require('jquery');
        }
        this.obj = new Job();
        let files = document.getElementById('pathToBag').files
        let filename = files[0].path;
        // If user selected directory, use the dir name.
        if (files.length > 1) {
            filename = path.dirname(files[0].path);
        }

        let uploadTargets = $('input[name="uploadTargets"]:checked').each(cb => $(cb).value).get().map(cb => cb.value)
        // This is a problem, because it deletes the upload result
        // along with the upload target. Hmm...
        this.obj.uploadOps = [];
        for (let targetId of uploadTargets) {
            let op = new UploadOperation();
            op.storageServiceId = targetId;
            op.sourceFiles = [ filename ]
            this.obj.uploadOps.push(op);
        }
    }
}

module.exports.BagUploadForm = BagUploadForm;
