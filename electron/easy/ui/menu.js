const es = require('../core/easy_store')

module.exports = class Menu {

    static jobNew() {
        var job = new es.Job();
        job.clearFiles();
        job.resetFileOptions();
        es.ActiveObject = job;
        $("#container").html(es.Templates.jobFiles());
    };

    static jobShow(id) {
        var job = es.Job.find(id);
        es.ActiveObject = job;
        $("#container").html(es.Templates.jobFiles());
        job.setFileListUI();
    }

    static setupShow() {
        var data = {};
        var setupsCompleted = es.Util.getInternalVar("Setups Completed");
        if (setupsCompleted && setupsCompleted.length) {
            data.setupsCompleted = `You have already completed the following setups: <b>${setupsCompleted.join(', ')}</b>`;
        }
        var setupList = new es.Field('setupProvider', 'setupProvider', 'Repository', '');
        setupList.choices = es.Choice.makeList(es.Plugins.listSetupProviders(), '', true);
        data.setupList = setupList;
        $("#container").html(es.Templates.setup(data));
        es.ActiveObject = null;
    }

}
