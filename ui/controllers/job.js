const ejs = require('ejs');
const { UI } = require('../common/ui');

const Files = UI.templates.jobForm;
const List = UI.templates.jobForm;
const Packaging = UI.templates.jobForm;
const Review = UI.templates.jobForm;
const Storage = UI.templates.jobForm;
const Summary = UI.templates.jobForm;

const List = UI.templates.jobList;

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
