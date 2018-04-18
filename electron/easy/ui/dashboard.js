const electron = require('electron');
const app = (process.type === 'renderer') ? electron.remote.app : electron.app;
const dateFormat = require('dateformat');
const fs = require('fs');
const path = require('path');
const { Job } = require('../core/job');
const { JobList } = require('./job_list');
const { Menu } = require('./menu');
const State = require('../core/state');
const Templates = require('../core/templates');

class Dashboard {

    constructor() {

    }

    initEvents() {
        $('#gettingStarted').click(function(e) {
            $("#container").html(Templates.help());
            State.ActiveObject = null;
        });
        $('#setupPage').click(function(e) {
            Menu.setupShow();
        });
        $('#newJobLink').click(function(e) {
            JobList.onNewClick();
        });
    }

    // showJobDetail() {
    //     var id = $(this).data('object-id');
    //     var data = {};
    //     var job = Job.find(id);
    //     data.job = job;
    //     if (job.bagItProfile != null) {
    //         data.bagInternalIdentifier = job.bagItProfile.bagInternalIdentifier();
    //         data.bagTitle = job.bagItProfile.bagTitle();
    //         data.bagDescription =job.bagItProfile.bagDescription();
    //     }
    //     data.opResults = [];
    //     for (var result of job.operationResults) {
    //         data.opResults.push({
    //             cssClass: result.succeeded ? 'text-success' : 'text-warning',
    //             summary: result.summary(),
    //             filename: path.basename(result.filename),
    //             filesize: result.filesize.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
    //             note: result.note,
    //             warning: result.warning,
    //             error: result.error
    //         });
    //         if (result.provider == "APTrust BagIt Provider") {
    //             var manifestDir = path.join(app.getPath('userData'), 'manifests');
    //             for (var filename of fs.readdirSync(manifestDir)) {
    //                 if (filename.startsWith(job.id)) {
    //                     data.hasManifest = true;
    //                     break;
    //                 }
    //             }
    //         }
    //     }
    //     State.ActiveObject = job;
    //     $('#jobDetail').html(Templates.jobSummaryPanel(data));
    //     $('#btnViewManifest').on('click', Dashboard.viewManifests);
    //     $('#btnGoToJob').on('click', Dashboard.loadJob);
    // }

    // TODO: This should be async, because when we load a manifest with
    // thousands of entries, it looks like the UI freezes.
    static viewManifests() {
        var jobId = $(this).data('object-id');
        var manifests = [];
        var manifestDir = path.join(app.getPath('userData'), 'manifests');
        for (var filename of fs.readdirSync(manifestDir)) {
            if (filename.startsWith(jobId)) {
                // Filename format is jobId_algorithm_timestamp.txt
                var parts = filename.split('_');
                var jobId = parts[0];
                var algorithm = parts[1];
                var timestamp = parts[2].split('.')[0];
                var ts = new Date(parseInt(timestamp, 10));
                var fullPath = path.join(manifestDir, filename);
                manifests.push({
                    jobId: jobId,
                    algorithm: algorithm,
                    timestamp: dateFormat(ts, 'shortDate') + " " + dateFormat(ts, 'shortTime'),
                    contents: fs.readFileSync(fullPath, "utf8"),
                });
            }
        }
        if (manifests.length == 0) {
            alert('No manifests available for this job.');
            return;
        }
        var data = {};
        data.manifests = manifests;
        $('#modalTitle').text("Manifests");
        $("#modalContent").html(Templates.manifest(data));
        $('#modal').modal();
    }

    static loadJob() {
        var id = $(this).data('object-id');
        var job = Job.find(id);
        State.ActiveObject = job;
        $("#container").html(Templates.jobFiles());
    }

}

module.exports.Dashboard = Dashboard;
