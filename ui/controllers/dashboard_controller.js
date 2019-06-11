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
        console.log(repoClients);
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
        for (let repo of repos) {
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
