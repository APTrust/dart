const ejs = require('ejs');
const { UI } = require('../common/ui');

const Form = UI.templates.bagItProfileForm;
const List = UI.templates.bagItProfileList;
const TagDefForm = UI.templates.bagItProfileTagDefForm;
const TagFileForm = UI.templates.bagItProfileTagFileForm;
const TagsList = UI.templates.bagItProfileTagsList;

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
