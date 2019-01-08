const Templates = require('../common/templates');

class JobController {

    constructor(job) {
        this.job = job;
    }

    create() {
        return 'Create Job';
    }

    update(params) {
        return 'Update Job';
    }

    list(params) {
        return 'List Job';
    }

    destroy() {
        return 'Destroy Job';
    }
}

module.exports.JobController = JobController;
