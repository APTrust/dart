const { BaseController } = require('./base_controller');
const fs = require('fs');
const path = require('path');
const { PluginManager } = require('../../plugins/plugin_manager');
const Templates = require('../common/templates');

const typeMap = {
    q: 'number'
}

class SetupController extends BaseController {

    constructor(params) {
        super(params, 'Settings');
        this.typeMap = typeMap;
        this.plugin;
        let id = params.get('id');
        if (id) {
            let pluginClass = PluginManager.findById(id);
            this.plugin = new pluginClass();
            this.pluginId = id;
        }
        this.typedParams = this.paramsToHash();
    }

    list() {
        let plugins = PluginManager.getModuleCollection('Setup');
        let items = [];
        for (let plugin of plugins) {
            let pluginInstance = new plugin();
            let desc = plugin.description();
            let setsUp = desc.setsUp[0];
            items.push({
                id: desc.id,
                name: desc.name,
                description: desc.description,
                logoPath: this.getLogoPath(pluginInstance.settingsDir),
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
        let desc = this.plugin.constructor.description();
        let data = {
            id: desc.id,
            name: desc.name,
            message: this.plugin.getMessage('start'),
            nextQuestion: 0
        }
        let html = Templates.setupStart(data);
        return this.containerContent(html);
    }

    question() {
        let questions = this.plugin.getQuestions();
        let index = this.typedParams['q'];
        let data = {
            id: this.pluginId,
            isFirstQuestion: index == 0,
            isLastQuestion: index == (questions.length - 1),
            prevQuestion: index - 1,
            nextQuestion: index + 1,
            question: questions[index]
        }
        let html = Templates.setupQuestion(data);
        return this.containerContent(html);
    }

    end() {
        return this.containerContent('End');
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
    getLogoPath(settingsDir) {
        let extensions = ['.png', '.jpg', '.jpeg', '.svg', '.gif'];
        for (let ext of extensions) {
            let logoPath = path.join(settingsDir, 'logo' + ext);
            if (fs.existsSync(logoPath)) {
                return logoPath;
            }
        }
        return null;
    }

    /**
     * This attaches click events to setup cards.
     */
    postRenderCallback(fnName) {
        $('.clickable-card').on('click', function(e) {
            location.href = $(this).data('url');
        });
    }

}

module.exports.SetupController = SetupController;
