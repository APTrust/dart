const { BaseController } = require('./base_controller');
const { Context } = require('../../core/context');
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
        // User clicked either Back or Next.
        let dir = this.typedParams['dir'];
        let currentIndex = dir == 'next' ? index - 1 : index + 1;
        if (currentIndex >= 0 && currentIndex < questions.length) {
            let currentQuestion = questions[currentIndex];
            if (currentQuestion.processResponse() == false) {
                Context.logger.debug("Invalid response for question " + currentIndex);
                return this._showQuestion(currentIndex, true, currentQuestion.value)
            }
        }
        return this._showQuestion(index, false);
    }

    _showQuestion(index, showError, withValue) {
        let questions = this.plugin.getQuestions();
        let question = questions[index];
        if (showError) {
            question.error = question.errMessage;
            question.value = withValue;
        } else {
            question.error = '';
            question.setInitialValue();
        }
        let data = {
            id: this.pluginId,
            isFirstQuestion: index == 0,
            isLastQuestion: index == (questions.length - 1),
            prevQuestion: index - 1,
            nextQuestion: index + 1,
            question: question
        }
        let html = Templates.setupQuestion(data);
        return this.containerContent(html);
    }

    runPreQuestionCallbacks() {
        Context.logger.info(Context.y18n.__("Running pre-question callbacks"));
        try {
            this.plugin.beforeObjectInstallation();
            this.plugin.installSettings();
            this.plugin.beforeAllQuestions();
        } catch (error) {
            return this._showError(error);
        }
        return this._showQuestion(0, false);
    }

    _showError(error) {
        Context.logger.error(error);
        let data = {
            error: error,
            stack: error.stack.split("\n")
        }
        let html = Templates.setupError(data);
        return this.containerContent(html);
    }


    end() {
        let questions = this.plugin.getQuestions();
        let currentIndex = questions.length - 1;
        let lastQuestion = questions[currentIndex];
        if (lastQuestion.processResponse() == false) {
            Context.logger.debug("Invalid response for question " + currentIndex);
            return this._showQuestion(currentIndex, true, lastQuestion.value)
        }
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
