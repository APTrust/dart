const { Job } = require('../core/job');
const State = require('../core/state');
const Templates = require('../core/templates');

class JobList {

    constructor() {
        // Nothing to do
    }

    initEvents() {
        $("#btnNewJob").on("click", JobList.onNewClick);
        $('.clickable-row[data-object-type="Job"]').on("click", this.onJobClick());
    }

    static onNewClick() {
        var job = new Job();
        job.clearFiles();
        job.resetFileOptions();
        State.ActiveObject = job;
        $("#container").html(Templates.jobFiles());
    }

    onJobClick(id) {
        var self = this;
        return function() {
            var id = $(this).data('object-id');
            var job = Job.find(id);
            State.ActiveObject = job;
            $("#container").html(Templates.jobFiles());
        }
    }

}

module.exports.JobList = JobList;
