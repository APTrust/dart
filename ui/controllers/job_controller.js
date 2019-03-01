const { BaseController } = require('./base_controller');
const { Job } = require('../../core/job');
const Templates = require('../common/templates');

const typeMap = {
    limit: 'number',
    offset: 'number',
}

class JobController extends BaseController {

    constructor(params) {
        super(params, 'Jobs');
        this.typeMap = typeMap;

        this.model = Job;
        //this.formClass = JobForm;
        //this.formTemplate = Templates.jobForm;
        this.listTemplate = Templates.jobList;
        this.nameProperty = 'name';
        this.defaultOrderBy = 'createdAt';
        this.defaultSortDirection = 'desc';
    }

    // create() {
    //     return this.containerContent('Create Job');
    // }

    // update() {
    //     return this.containerContent('Update Job');
    // }

    // list() {
    //     return this.containerContent('List Jobs');
    // }

    // destroy() {
    //     return this.containerContent('Destroy Job');
    // }
}

module.exports.JobController = JobController;
