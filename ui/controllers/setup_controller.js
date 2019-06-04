const { BaseController } = require('./base_controller');
const { Context } = require('../../core/context');
const fs = require('fs');
const { InternalSetting } = require('../../core/internal_setting');
const path = require('path');
const { PluginManager } = require('../../plugins/plugin_manager');
const Templates = require('../common/templates');

const typeMap = {
    q: 'number'
}

/**
 * The SetupController installs an organization's default settings and
 * walks the user through a series of questions to collect custom setting
 * information. See {@link SetupBase} for info on how to write a Setup
 * plugin.
 *
 * @param {url.URLSearchParams} params - URL parameters from the UI.
 * These usually come from a query string attached to the href attribute
 * of a link or button.
 *
 */
class SetupController extends BaseController {

    constructor(params) {
        super(params, 'Settings');
        /**
         * This maps items in params to their correct type (number,
         * boolean, or string).
         *
         * @type {object}
         */
        this.typeMap = typeMap;
        /**
         * The Setup plugin that includes a number of settings to
         * install and questions to ask the user.
         *
         * @type {SetupBase}
         */
        this.plugin = null;
        /**
         * The id of Setup plugin that the controller is running.
         *
         * @type {string}
         */
        this.pluginId = null;
        let id = params.get('id');
        if (id) {
            let pluginClass = PluginManager.findById(id);
            this.plugin = new pluginClass();
            this.pluginId = id;
        }
        /**
         * Contains the same keys and values as the params object,
         * but they have been cast to the proper types (number, boolean,
         * string).
         *
         * @type {object}
         */
        this.typedParams = this.paramsToHash();
    }

    /**
     * Displays a list of available Setup plugins.
     */
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
                lastRun: this._formatLastRunDate(plugin.name)
            });
        }
        let data = {
            items: items
        }
        let html = Templates.setupList(data);
        return this.containerContent(html);
    }

    /**
     * Returns the date that a Setup plugin was last run, or Never if
     * the Setup plugin has not been installed.
     *
     * @returns {string}
     */
    _formatLastRunDate(pluginClassName) {
        let lastRun = Context.y18n.__('Never');
        let date = this._getLastRunDate(pluginClassName);
        console.log(date);
        if (date) {
            lastRun = date.toDateString();
        }
        return lastRun;
    }

    /**
     * Returns the date that a Setup plugin was last run, or null if
     * the Setup plugin has not been installed.
     *
     * @returns {Date}
     */
    _getLastRunDate(pluginClassName) {
        let date = null;
        let data = InternalSetting.firstMatching('name', pluginClassName);
        if (data) {
            try { date = new Date(data.value) }
            catch (ex) { }
        }
        return date;
    }

    /**
     * Displays the Setup plugin's start message.
     *
     */
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

    /**
     * Displays a question from the Setup plugin. If a question is already
     * showing when this is called, it validates the user's response and
     * saves it if the response was valid, or displays a validation error
     * message if the response was invalid.
     *
     */
    question() {
        let questions = this.plugin.getQuestions();
        let index = this.typedParams['q'];
        // User clicked either Back or Next.
        let dir = this.typedParams['dir'];
        let currentIndex = dir == 'next' ? index - 1 : index + 1;
        let currentQuestion = questions[currentIndex];
        if (currentIndex >= 0 && currentIndex < questions.length) {
            if (currentQuestion.processResponse() == false) {
                Context.logger.debug("Invalid response for question " + currentIndex);
                return this._showQuestion(currentIndex, true, currentQuestion.value)
            }
        }
        // On successful response, call the afterEach callback
        this.plugin.afterEachQuestion(currentQuestion);
        return this._showQuestion(index, false);
    }

    /**
     * Displays a question.
     *
     * @param {number} index - The number of the question to display.
     * This is the index of the question within the array that contains
     * all of this plugin's questions.
     *
     * @param {boolean} showError - If true, this displays the validation
     * error.
     *
     * @param {string} [withValue] - Display the question with this
     * value filled in as the default.
     *
     * @private
     */
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

    /**
     * This runs the following callbacks (defined in {@link SetupBase} in
     * order:
     *
     * * {@link SetupBase#beforeObjectInstallation}
     * * {@link SetupBase#installSettings}
     * * {@link SetupBase#beforeAllQuestions}
     *
     * That this is called when the user clicks the Next button on the
     * Setup start page. When this completes, it sends the user on to the
     * first setup question.
     */
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

    /**
     * This displays exceptions that occurred during the setup process.
     * These are unexpected exceptions, not validation errors.
     *
     * @private
     */
    _showError(error) {
        Context.logger.error(error);
        let data = {
            error: error,
            stack: error.stack.split("\n")
        }
        let html = Templates.setupError(data);
        return this.containerContent(html);
    }


    /**
     * This displays the end message at the end of the setup process.
     * It also calls {@link SetupBase#afterAllQuestions} and creates
     * or updates an internal setting describing when the setup completed.
     *
     */
    end() {
        let questions = this.plugin.getQuestions();
        let currentIndex = questions.length - 1;
        let lastQuestion = questions[currentIndex];
        if (lastQuestion.processResponse() == false) {
            Context.logger.debug("Invalid response for question " + currentIndex);
            return this._showQuestion(currentIndex, true, lastQuestion.value)
        }
        this.plugin.afterAllQuestions();
        this.plugin.setCompletionTimestamp();
        let desc = this.plugin.constructor.description();
        let data = {
            id: desc.id,
            name: desc.name,
            message: this.plugin.getMessage('end'),
            prevQuestion: currentIndex
        }
        let html = Templates.setupEnd(data);
        return this.containerContent(html);
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
