const $ = require('jquery');
const { Context } = require('../../core/context');
const dateFormat = require('dateformat');
const { Job } = require('../../core/job');
const { PluginManager } = require('../../plugins/plugin_manager');
const { RemoteRepository } = require('../../core/remote_repository');
const { RunningJobsController } = require('./running_jobs_controller');
const Templates = require('../common/templates');
const { Util } = require('../../core/util');

/**
 * The Dashboard crontroller displays information about recent
 * jobs, recent uploads, etc.
 *
 */
class DashboardController extends RunningJobsController {

    constructor(params) {
        super(params, 'Dashboard')
    }

    /**
     * This collects and renders all of the data to be displayed
     * in the Dashboard. The data includes information about currently
     * running jobs, recently defined jobs, and information fetched
     * from any remote repositories DART can connect to.
     *
     */
    show() {
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
            runningJobs: Object.values(Context.childProcesses),
            recentJobs: this._getRecentJobSummaries()
        });

        // Call the reports. These are asynchronous, since they have to
        // query remote repositories. The callbacks describe which HTML
        // element on the rendered page will contain the HTML output of
        // the reports.
        repoReports.forEach((report) => {
            let elementId = '#' + report.id
            report.method().then(
                result => {
                    $(elementId).removeClass('text-danger');
                    $(elementId).html(result)
                },
                error => {
                    $(elementId).addClass('text-danger');
                    $(elementId).html(error)
                }
            );
        });

        return this.containerContent(html);
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
        // This sort can approximate the 20 most recent jobs,
        // but the sort below, based on a calculated value, is more accurate.
        let opts = {limit: 20, offset: 0, orderBy: 'createdAt', sortDir: 'desc'};
        // TODO: Override list() in Job to do its own inflation?
        let jobs = Job.list(null, opts).map((data) => { return Job.inflateFrom(data) });
        for (let job of jobs) {
            let [outcome, timestamp] = this._getJobOutcomeAndTimestamp(job);
            jobSummaries.push({
                name: job.title,
                outcome: outcome,
                date: timestamp
            });
        }
        let sortFn = Util.getSortFunction('date', 'desc');
        return jobSummaries.sort(sortFn);
    }

    /**
     * This returns formatted information about the outcome of a job
     * and when that outcome occurred. The return value is a two-element
     * array of strings. The first element describes the outcome. The
     * second is the date on which the outcome occurred.
     *
     * @returns {Array<string>}
     *
     */
    _getJobOutcomeAndTimestamp(job) {
        // TODO: This code has some overlap with JobController#colorCodeJobs.
        let outcome = "Job has not been run.";
        let timestamp = null;
        if(job.uploadAttempted()) {
            outcome = job.uploadSucceeded() ? 'Uploaded' : 'Upload failed';
            timestamp = dateFormat(job.uploadedAt(), 'yyyy-mm-dd');
        } else if (job.validationAttempted) {
            outcome = job.validationSucceeded() ? 'Validated' : 'Validation failed';
            timestamp = dateFormat(job.validatedAt(), 'yyyy-mm-dd');
        } else if (job.packageAttempted()) {
            outcome = job.packageSucceeded() ? 'Packaged' : 'Packaging failed';
            timestamp = dateFormat(job.packagedAt(), 'yyyy-mm-dd');
        }
        return [outcome, timestamp]
    }

    /**
     * This returns a list of repository clients that look like they
     * can return data from remote repository. To find a list of viable
     * repository clients, DART first gets a list of all
     * {@link RemoteRepository} objects. If the RemoteRepository object
     * includes a {@link RemoteRepository#pluginId}, this function creates
     * an instance of the plugin and calls the plugin's {@link
     * RepositoryBase#hasRequiredConnectionInfo} method. If the method
     * returns true, the instantiated client will be returned in the list
     * of viable repo clients.
     *
     * @returns {Array<RepositoryBase>}
     *
     */
    _getViableRepoClients() {
        let repoClients = [];
        let repos = RemoteRepository.list((r) => { return !Util.isEmpty(r.pluginId) });
        for (let _repoData of repos) {
            // TODO: This object inflation should be pushed down into the
            // RemoteRepository class.
            let repo = new RemoteRepository();
            Object.assign(repo, _repoData);
            let clientClass = PluginManager.findById(repo.pluginId);
            let clientInstance = new clientClass(repo);
            if (clientInstance.hasRequiredConnectionInfo()) {
                repoClients.push(clientInstance);
            }
        }
        return repoClients;
    }

    /**
     * This returns a list of report rows to be displayed in the dashboard.
     * Each row has up to two reports. (Because we're using the brain dead
     * Handlebars templating library, we have to format our data structures
     * precisely before rendering them. And, by the way, templates *should*
     * be brain dead, because when they start thinking, they become evil,
     * like PHP and React.)
     *
     * @param {} repoReports - A list of repo report summary objects, which
     * can be obtained from
     * {@link DashboardController#_getRepoReportDescriptions}.
     *
     * @returns {Array<Array<object>>}
     */
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

    /**
     * This returns an array of objects describing all of the
     * reports available from all of the viable repository clients.
     *
     * Internally, this calls {@link RepositoryBase#provides} to
     * get the title, description, and function to call for each report.
     *
     * This adds an id to each description record, so the Dashboard
     * controller can map each report to the HTML element that will
     * display its output.
     *
     * Each item in the returned array will have properies id, title,
     * description, and method.
     *
     * @returns {Array<object>}
     *
     */
    _getRepoReportDescriptions(clients) {
        let reports = [];
        let clientNumber = 0;
        clients.forEach((client) => {
            clientNumber++;
            let className = client.constructor.name;
            let reportIndex = 0;
            client.provides().forEach((report) => {
                reportIndex++;
                reports.push({
                    id: `${className}_${clientNumber}_${reportIndex}`,
                    title: report.title,
                    description: report.description,
                    method: report.method
                });
            }
        )});
        return reports;
    }

    postRenderCallback(fnName) {
        for(let dartProcess of Object.values(Context.childProcesses)) {
            this.initRunningJobDisplay(dartProcess);
        }
    }

}

module.exports.DashboardController = DashboardController;
