const $ = require('jquery');
const { BaseController } = require('./base_controller');
const { PluginManager } = require('../../plugins/plugin_manager');
const { RemoteRepository } = require('../../core/remote_repository');
const Templates = require('../common/templates');
const { Util } = require('../../core/util');

class DashboardController extends BaseController {

    constructor(params) {
        super(params, 'Dashboard')
    }

    show() {
        let repoClients = this.getViableRepoClients();
        //console.log(repoClients);

        // TODO: We need to call client.provides() to get a list
        // of available calls.

        // For POC only. We want the following to be flexible,
        // not hard wired. This all hacked for now, so we can fiddle
        // with the display.
        let demoClient = repoClients[0];
        let demoItemsHTML = '';
        let demoObjectsHTML = '';
        demoClient.recentIngests().then(
            result => { $('#aptDemoIngests').html(result) },
            error => alert(error));
        demoClient.recentWorkItems().then(
            result => { $('#aptDemoTasks').html(result) },
            error => alert(error));

        // let prodClient = repoClients[1];

        let data = {
            demoObjectsHTML: demoObjectsHTML,
            demoItemsHTML: demoItemsHTML
        }


        let html = Templates.dashboard({});
        return this.containerContent(html);
    }

    _getRunningJobs() {

    }

    _getRecentJobs() {

    }

    _getConnectableRepos() {

    }

    getViableRepoClients() {
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

}

module.exports.DashboardController = DashboardController;
