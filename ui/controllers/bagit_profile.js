const { BaseController } = require('./base_controller');
const Templates = require('../common/templates');

class BagItProfileController extends BaseController {

    constructor(params) {
        super(params, 'Settings');
    }

    create() {
        return this.containerContent('Create BagItProfile');
    }

    update() {
        return this.containerContent('Update BagItProfile');
    }

    list() {
        return this.containerContent('List BagItProfile');
    }

    destroy() {
        return this.containerContent('Destroy BagItProfile');
    }
}

module.exports.BagItProfileController = BagItProfileController;
