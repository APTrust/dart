const { BaseController } = require('./base_controller');
const Templates = require('../common/templates');

class UploadTargetController extends BaseController {

    constructor(params) {
        super(params, 'UploadTarget');
    }

    create() {
        return this.containerContent('Create UploadTarget');
    }

    update() {
        return this.containerContent('Update UploadTarget');
    }

    list() {
        return this.containerContent('List UploadTarget');
    }

    destroy() {
        return this.containerContent('Destroy UploadTarget');
    }
}

module.exports.UploadTargetController = UploadTargetController;
