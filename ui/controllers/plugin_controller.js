const { BaseController } = require('./base_controller');
const { PluginManager } = require('../../plugins/plugin_manager');
const Templates = require('../common/templates');
const { Util } = require('../../core/util');

class PluginController extends BaseController {

    constructor(params) {
        super(params, 'Settings');
    }

    list() {
        let plugins = [];
        let sortFn = Util.getSortFunction('name', 'asc');
        for (let pluginType of PluginManager.types()) {
            for (let module of PluginManager.getModuleCollection(pluginType)) {
                let desc = module.description();
                desc['type'] = Util.camelToTitle(pluginType);
                plugins.push(desc)
            }
        }
        let data = {
            items: plugins.sort(sortFn)
        }
        let html = Templates.pluginsList(data);
        return this.containerContent(html);
    }

}

module.exports.PluginController = PluginController;
