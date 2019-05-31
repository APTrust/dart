const { BaseController } = require('./base_controller');
const fs = require('fs');
const path = require('path');
const { PluginManager } = require('../../plugins/plugin_manager');
const Templates = require('../common/templates');

const setupDir = path.join(__dirname, '..', '..', 'plugins', 'setup');

class SetupController extends BaseController {

    constructor(params) {
        super(params, 'Settings');
    }

    list() {
        let plugins = PluginManager.getModuleCollection('Setup');
        let items = [];
        for (let plugin of plugins) {
            let desc = plugin.description();
            let setsUp = desc.setsUp[0];
            items.push({
                name: desc.name,
                description: desc.description,
                logoPath: this.getLogoPath(setsUp),
                lastRun: 'Yesterday' // Placeholder
            });
        }
        let data = {
            items: items
        }
        let html = Templates.setupList(data);
        return this.containerContent(html);
    }

    start() {
        return this.containerContent('Start Setup');
    }

    next(params) {
        return this.containerContent('Next Setup');
    }

        /**
     * This returns the path to the logo for this setup plugin. That's
     * the first file in the directory that contains your questions.json,
     * app_settings.json, etc. that matches any of the following names:
     *
     * * logo.png
     * * logo.jpg
     * * logo.jpeg
     * * logo.svg
     * * logo.gif
     *
     * You can override this method if you want to return some other path.
     *
     * @returns {string}
     */
    getLogoPath(subDir) {
        let extensions = ['.png', '.jpg', '.jpeg', '.svg', '.gif'];
        for (let ext of extensions) {
            let logoPath = path.join(setupDir, subDir, 'logo' + ext);
            if (fs.existsSync(logoPath)) {
                return logoPath;
            }
        }
        return null;
    }

}

module.exports.SetupController = SetupController;
