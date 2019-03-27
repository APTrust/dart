const { BagItProfile } = require('../../bagit/bagit_profile');
const { Choice } = require('./choice');
const { Context } = require('../../core/context');
const { Field } = require('./field');
const { Form } = require('./form');
const { PluginManager } = require('../../plugins/plugin_manager');
const { UploadTarget } = require('../../core/upload_target');
const { Util } = require('../../core/util');

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
        let data = {
            id: job.id,
            uploadTargets: UploadTarget.list(null, listOptions)
        }
        super('JobUpload', data);
        this.allTargets = data.uploadTargets;
        this._init(job);
    }

    _init(job) {
        let selectedTargets = job.uploadOps.map(op => op.uploadTargetId).filter(id => id != '');
        this.fields['uploadTargets'].choices = Choice.makeList(
            this.allTargets,
            selectedTargets,
            false
        );
    }

    copyFormValuesToJob(job) {
        this.parseFromDOM();

    }
}

module.exports.JobUploadForm = JobUploadForm;
