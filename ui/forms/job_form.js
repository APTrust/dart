const { Job } = require('../../core/job');
const { Choice } = require('./choice');
const { Field } = require('./field');
const { Form } = require('./form');

class JobForm extends Form {

    constructor(appSetting) {
        super('Job', appSetting);
        this._init();
    }

    _init() {

    }

}

module.exports.JobForm = JobForm;
