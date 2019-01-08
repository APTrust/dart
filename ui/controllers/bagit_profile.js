const Templates = require('../common/templates');

class BagItProfileController {

    constructor(bagItProfile) {
        this.bagItProfile = bagItProfile;
    }

    create() {
        return 'Create BagItProfile';
    }

    update(params) {
        return 'Update BagItProfile';
    }

    list(params) {
        return 'List BagItProfile';
    }

    destroy() {
        return 'Destroy BagItProfile';
    }
}

module.exports.BagItProfileController = BagItProfileController;
