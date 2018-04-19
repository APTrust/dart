const electron = require('electron');
const app = (process.type === 'renderer') ? electron.remote.app : electron.app;
const dateFormat = require('dateformat');
const fs = require('fs');
const path = require('path');

const { AppSetting } = require('../core/app_setting');
const { Job } = require('../core/job');
const { JobList } = require('./job_list');
const log = require('../core/log');
const { Menu } = require('./menu');
const Plugins = require('../plugins/plugins');
const State = require('../core/state');
const Templates = require('../core/templates');

class Dashboard {

    constructor(jobs) {
        this.jobs = jobs;
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
        $('a.show-manifests').click(Dashboard.showManifests);

        // Not working yet.
        this.checkJobsInRemoteRepo();
    }

    checkJobsInRemoteRepo() {
        var repoPlugin = null;
        var repoSetting = AppSetting.findByName("Remote Repository");
        if (!repoSetting || !repoSetting.value) {
            log.info("Dashboard: No remote repo in settings");
            return;
        }
        if (repoSetting) {
            repoPlugin = Plugins.getRepositoryProviderByName(repoSetting.value);
            if (repoPlugin == null) {
                log.info(`Repository plugin ${repoPlugin.value} not found`);
                return;
            }
        }
        for (var job of this.jobs) {
            let emitter = Plugins.newRepoEmitter();
            let provider = new repoPlugin(job, emitter);
            provider.getObjectInfo();
        }
    }


    // TODO: This should be async, because when we load a manifest with
    // thousands of entries, it looks like the UI freezes.
    static showManifests() {
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
