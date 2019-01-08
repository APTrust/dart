const { BaseController } = require('./base_controller');
const Templates = require('../common/templates');

class JobController extends BaseController {

    constructor(params) {
        super(params, 'Jobs');
    }

    create() {
        return this.containerContent('Create Job');
    }

    update() {
        return this.containerContent('Update Job');
    }

    list() {
        return this.containerContent('List Jobs');
    }

    destroy() {
        return this.containerContent('Destroy Job');
    }
}

module.exports.JobController = JobController;
