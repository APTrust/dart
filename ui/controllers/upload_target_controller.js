const { BaseController } = require('./base_controller');
const Templates = require('../common/templates');
const { UploadTarget } = require('../../core/upload_target');
const { UploadTargetForm } = require('../forms/upload_target_form');

// This allows us to convert query string params
// to their proper types. No need to specify strings, since
// they don't need to be converted.
const typeMap = {
    userCanDelete: 'boolean',
    port: 'number'
}

class UploadTargetController extends BaseController {

    constructor(params) {
        super(params, 'UploadTarget');
        this.typeMap = typeMap;
    }

    new() {
        let form = UploadTargetForm.create(new UploadTarget());
        let html = Templates.uploadTargetForm({ form: form });
        return this.containerContent(html);
    }

    edit() {
        let target = UploadTarget.find(this.params.get('id'));
        let form = UploadTargetForm.create(target);
        let html = Templates.uploadTargetForm({ form: form });
        return this.containerContent(html);
    }

    update() {
        let target = UploadTarget.find(this.params.get('id')) || new UploadTarget();
        let form = UploadTargetForm.create(target);
        form.parseFromDOM();
        if (!form.obj.validate()) {
            form.setErrors();
            let html = Templates.uploadTargetForm({ form: form });
            return this.containerContent(html);
        }
        this.alertMessage = `Saved upload target "${form.obj.name}"`;
        target.save();
        return this.list();
    }

    list() {
        let listParams = this.paramsToHash();
        let items = UploadTarget.list(null, listParams);
        let data = {
            alertMessage: this.alertMessage,
            items: items
        };
        let html = Templates.uploadTargetList(data);
        return this.containerContent(html);
    }

    destroy() {
        let target = UploadTarget.find(this.params.get('id'));
        if (confirm(`Delete upload target "${target.name}"?`)) {
            this.alertMessage = `Deleted upload target "${target.name}"`;
            target.delete();
            return this.list();
        }
        return this.noContent();
    }
}

module.exports.UploadTargetController = UploadTargetController;
