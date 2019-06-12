const $ = require('jquery');
const { BaseController } = require('./base_controller');
const dateFormat = require('dateformat');
const { Job } = require('../../core/job');
const { PluginManager } = require('../../plugins/plugin_manager');
const { RemoteRepository } = require('../../core/remote_repository');
const Templates = require('../common/templates');
const { Util } = require('../../core/util');

class DashboardController extends BaseController {

    constructor(params) {
        super(params, 'Dashboard')
    }

    show() {
        // let repoClients = this._getViableRepoClients();
        //console.log(repoClients);

        // TODO: We need to call client.provides() to get a list
        // of available calls.

        // For POC only. We want the following to be flexible,
        // not hard wired. This all hacked for now, so we can fiddle
        // with the display.
        // let demoClient = repoClients[0];
        // let demoItemsHTML = '';
        // let demoObjectsHTML = '';
        // demoClient.recentIngests().then(
        //     result => { $('#aptDemoIngests').html(result) },
        //     error => alert(error));
        // demoClient.recentWorkItems().then(
        //     result => { $('#aptDemoTasks').html(result) },
        //     error => alert(error));

        // // let prodClient = repoClients[1];

        // let data = {
        //     demoObjectsHTML: demoObjectsHTML,
        //     demoItemsHTML: demoItemsHTML
        // }

        // Get a list of RemoteRepository clients that have enough information
        // to attempt a connection with the remote repo.
        let clients = this._getViableRepoClients();

        // Get a list of available reports.
        let repoReports = this._getRepoReportDescriptions(clients);

        // Each of these clients can provide one or more reports. We want to
        // display the reports in rows, with two reports per row.
        let reportRows = this._getRepoRows(repoReports);

        // Assemble the HTML
        let html = Templates.dashboard({
            reportRows: reportRows,
            runningJobs: null,
            recentJobs: this._getRecentJobSummaries()
        });

        // Call the reports. These are asynchronous, since they have to
        // query remote repositories. The callbacks describe which HTML
        // element on the rendered page will contain the HTML output of
        // the reports.
        repoReports.forEach((report) => {
            let elementId = '#' + report.id
            report.method().then(
                result => { $(elementId).html(result) },
                error => $(elementId).html(error)
            );
        });

        return this.containerContent(html);
    }

    _getRunningJobs() {

    }

    /**
     * This returns summary info about the ten most recent jobs.
     * The return value is an array of objects, each of which has three
     * string properties. Object.name is the job name. Object.outcome
     * is the name and outcome of the last attempted action.
     * Object.date is the date at which the job last completed.
     *
     * @returns {Array<object>}
     */
    _getRecentJobSummaries() {
        let jobSummaries = [];
        let opts = {limit: 10, offset: 0, orderBy: 'updatedAt', sortDir: 'desc'};
        // TODO: Override list() in Job to do its own inflation?
        let jobs = Job.list(null, opts).map((data) => { return Job.inflateFrom(data) });
        console.log(jobs);
        for (let job of jobs) {
            let [outcome, timestamp] = this._getJobOutcomeAndTimestamp(job);
            jobSummaries.push({
                name: job.title,
                outcome: outcome,
                date: timestamp
            });
        }
        return jobSummaries;
    }

    _getJobOutcomeAndTimestamp(job) {
        // TODO: This code has some overlap with JobController#colorCodeJobs.
        let outcome = "Job has not been run.";
        let timestamp = null;
        if(job.uploadAttempted()) {
            outcome = job.uploadSucceeded() ? 'Uploaded' : 'Upload failed';
            timestamp = dateFormat(job.uploadedAt(), 'shortDate');
        } else if (job.validationAttempted) {
            outcome = job.validationSucceeded() ? 'Validated' : 'Validation failed';
            timestamp = dateFormat(job.validatedAt(), 'shortDate');
        } else if (job.packageAttempted()) {
            outcome = job.packageSucceeded() ? 'Packaged' : 'Packaging failed';
            timestamp = dateFormat(job.packagedAt(), 'shortDate');
        }
        return [outcome, timestamp]
    }

    _getViableRepoClients() {
        let repoClients = [];
        let repos = RemoteRepository.list((r) => { return !Util.isEmpty(r.pluginId) });
        for (let _repoData of repos) {
            // TODO: This object inflation should be pushed down into the
            // RemoteRepository class.
            let repo = new RemoteRepository();
            Object.assign(repo, _repoData);
            let clientClass = PluginManager.findById(repo.pluginId);
            //console.log(clientClass);
            let clientInstance = new clientClass(repo);
            //console.log(clientInstance);
            if (clientInstance.hasRequiredConnectionInfo()) {
                repoClients.push(clientInstance);
            }
        }
        return repoClients;
    }

    // Returns a list of report rows to be displayed in the dashboard.
    // Each row has up to two reports.
    _getRepoRows(repoReports) {
        let reportRows = [];
        let i = 0;
        while (i < repoReports.length) {
            let report1 = repoReports[i];
            let report2 = i + 1 < repoReports.length ? repoReports[i + 1] : null;
            reportRows.push([report1, report2]);
            i += 2;
        }
        return reportRows;
    }

    // Returns a list of all reports.
    _getRepoReportDescriptions(clients) {
        let reports = [];
        clients.forEach((client) => {
            let className = client.constructor.name;
            let reportIndex = 1;
            client.provides().forEach((report) => {
                reports.push({
                    id: `${className}_${reportIndex}`,
                    title: report.title,
                    description: report.description,
                    method: report.method
                });
                reportIndex++;
            }
        )});
        return reports;
    }

}

module.exports.DashboardController = DashboardController;
