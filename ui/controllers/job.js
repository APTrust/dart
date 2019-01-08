const Templates = require('../common/templates');

class JobController {

    constructor(params) {
        this.params = params;
    }

    create() {
        return 'Create Job';
    }

    update() {
        return 'Update Job';
    }

    list() {
        return 'List Job';
    }

    destroy() {
        return 'Destroy Job';
    }
}

module.exports.JobController = JobController;
