//////////////////////////////////////////////////////////
//    TODO: DELETE AFTER REFACTORING JOBS CONTROLLER    //
//////////////////////////////////////////////////////////

const $ = require('jquery');  // required for Jest tests
const { Context } = require('../../core/context');
const { Util } = require('../../core/util');

/**
 * JobPackagingUIHelper provides a number of methods to help with
 * the part of the Job UI that allows users to define how their
 * job should be packaged.
 *
 * @param {Job} job - The job whose files you want to manipulate.
 */
class JobPackagingUIHelper {

    constructor(job) {
        this.job = job;
    }

    /**
     * This attaches required events to elements of the Job
     * packaging UI.
     */
    initUI() {
        $("select[name=packageFormat]").change(this.onFormatChange());

        // TODO: Impelement bag name suggestion.
        // $(".suggest-name").click(this.onSuggestClick());
    }



    onFormatChange() {
        return function() {
            var format = $("select[name=packageFormat]").val();
            if (format == 'BagIt') {
                $('#jobProfileContainer').show();
            } else {
                $('#jobProfileContainer').hide();
            }
        }
    }

}

module.exports.JobPackagingUIHelper = JobPackagingUIHelper;
