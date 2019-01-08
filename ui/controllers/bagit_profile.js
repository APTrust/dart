const Templates = require('../common/templates');

class BagItProfileController {

    constructor(params) {
        this.params = params;
    }

    create() {
        return 'Create BagItProfile';
    }

    update() {
        return 'Update BagItProfile';
    }

    list() {
        return 'List BagItProfile';
    }

    destroy() {
        return 'Destroy BagItProfile';
    }
}

module.exports.BagItProfileController = BagItProfileController;
