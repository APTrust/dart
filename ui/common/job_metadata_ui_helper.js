const $ = require('jquery');  // required for Jest tests
const { Context } = require('../../core/context');
const { Util } = require('../../core/util');

/**
 * JobMetadataUIHelper provides a number of methods to help with
 * the part of the Job UI that allows users to define how their
 * job should be packaged.
 *
 * @param {Job} job - The job whose files you want to manipulate.
 */
class JobMetadataUIHelper {

    constructor(job) {
        this.job = job;
    }

    /**
     * This attaches required events to elements of the Job
     * metadata UI.
     */
    initUI() {
        $("#btnToggleHidden").click(function() {
            let btnText = Context.y18n.__();
            $('.form-group-hidden').toggle();
        });

        $("#btnAddNewTag").click(function() {
            alert('This feature is coming soon.');
        });
    }

}

module.exports.JobMetadataUIHelper = JobMetadataUIHelper;
