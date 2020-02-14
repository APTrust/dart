const $ = require('jquery');
const { AppSetting } = require('../../core/app_setting');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { BaseController } = require('./base_controller');
const { Constants } = require('../../core/constants');
const { Context } = require('../../core/context');
const Dart = require('../../core');
const { ExportQuestion } = require('../../core/export_question');
const { ExportSettings } = require('../../core/export_settings');
const { RemoteRepository } = require('../../core/remote_repository');
const request = require('request');
const { SettingsExportForm } = require('../forms/settings_export_form');
const { SettingsQuestionsForm } = require('../forms/settings_questions_form');
const { StorageService } = require('../../core/storage_service');
const Templates = require('../common/templates');
const url = require('url');

// TODO: Finish tests for this controller.
// TODO: Copy responses on import.
// TODO: Explicit confirmation on import.

/**
 * SettingsController imports JSON settings from a URL or from
 * cut-and-pasted text. The settings JSON should be in the format below.
 * Note that each array is optional.
 *
 * @example
 * {
 *   appSettings: [ ... array of AppSetting objects ... ],
 *   bagItProfiles: [ ... array of BagItProfile objects ... ],
 *   remoteRepositories: [ ... array of RemoteRepository objects ... ],
 *   storageServices: [ ... array of StorageService objects ... ],
 * }
 *
 * @see {@link AppSetting}
 * @see {@link BagItProfile}
 * @see {@link RemoteRepository}
 * @see {@link StorageService}
 *
 */
class SettingsController extends BaseController {

    constructor(params) {
        super(params, 'Settings');
        this.questionsForm = null;
    }

    /**
     * Shows the page where a user can import settings from text or a URL.
     *
     */
    import() {
        let html = Templates.settingsImport;
        return this.containerContent(html);
    }


    /**
     * Shows the page where a user can choose which settings to export.
     *
     */
    export() {
        let settings = ExportSettings.find(Constants.EMPTY_UUID) || new ExportSettings();
        let form = new SettingsExportForm(settings);
        let data = { form: form };
        let html = Templates.settingsExport(data);
        return this.containerContent(html);
    }

    /**
     * Resets the settings export form by erasing all export settings and
     * questions.
     *
     */
    reset() {
        new ExportSettings().save();
        return this.redirect('Settings', 'export', this.params);
    }

    /**
     * Saves export settings, then redirects to the export settings page.
     *
     */
    saveAndGoToExport() {
        let settings = ExportSettings.find(Constants.EMPTY_UUID) || new ExportSettings();
        this.questionsForm = new SettingsQuestionsForm(settings);
        this.questionsForm.parseQuestionsForExport();
        this.questionsForm.obj.save();
        return this.redirect("Settings", "export", this.params);
    }

    /**
     * Saves export settings, then redirects to the questions page.
     *
     */
    saveAndGoToQuestions() {
        let settings = ExportSettings.find(Constants.EMPTY_UUID) || new ExportSettings();
        let itemsForm = new SettingsExportForm(settings);
        itemsForm.parseItemsForExport();
        if (!itemsForm.obj.anythingSelected()) {
            alert(Context.y18n.__("You must select at least one item to export before you can add questions."));
            return this.noContent();
        }
        itemsForm.obj.save();
        return this.redirect("Settings", "showQuestionsForm", this.params);
    }

    /**
     * Shows the form where a user can define setup questions.
     *
     */
    showQuestionsForm() {
        let settings = ExportSettings.find(Constants.EMPTY_UUID);
        this.questionsForm = new SettingsQuestionsForm(settings);
        let html = Templates.settingsQuestions({
            questions: this.questionsForm.getQuestionsAsArray()
        });
        return this.containerContent(html);
    }

    /**
     * Shows the exported settings in JSON format in a modal dialog.
     *
     */
    showExportJson() {
        let settings = ExportSettings.find(Constants.EMPTY_UUID) || new ExportSettings();
        let form = null;
        let fromPage = this.params.get("fromPage")
        if (fromPage == "export") {
            form = new SettingsExportForm(settings);
            form.parseItemsForExport();
        } else { // fromPage == "questions"
            form = new SettingsQuestionsForm(settings);
            form.parseQuestionsForExport();
        }
        form.obj.save();
        let title = Context.y18n.__("Exported Settings");
        let body = Templates.settingsExportResult({
            json: JSON.stringify(form.obj, this._jsonFilter, 2)
        });
        return this.modalContent(title, body);
    }

    /**
     * Handler for clicks on the radio button where user specifies
     * that they want to import a BagIt profile from a URL.
     *
     * This shows the URL field and hides the textarea.
     *
     * @private
     */
    _importSourceUrlClick(e) {
        $('#txtJsonContainer').hide();
        $('#txtUrlContainer').show();
    }


    /**
     * Handler for clicks on the radio button where user specifies
     * that they want to import a BagIt profile from cut-and-paste JSON.
     *
     * This shows the textarea and hides the URL field.
     *
     * @private
     */
    _importSourceTextAreaClick(e) {
        $('#txtUrlContainer').hide();
        $('#txtJsonContainer').show();
    }

    /**
     * This attaches event handlers after the page loads.
     *
     */
    postRenderCallback(fnName) {
        let controller = this;
        if (fnName == 'import') {
            this._attachImportHandlers();
        } else if (fnName == 'export') {
            this._attachExportHandlers();
        } else if (fnName == 'showExportJson') {
            $('#btnCopyToClipboard').click(function() {
                controller._copyToClipboard()
            });
        } else if (fnName == 'showQuestionsForm') {
            for (let i = 0; i < this.questionsForm.rowCount; i++) {
                controller._attachQuestionCallbacks(i);
            }
            $('#btnAdd').click(() => { controller._addQuestion() });
            $('button[data-action-type=delete-question]').click((e) => {
                let questionNumber = parseInt($(e.currentTarget).attr('data-question-number'), 10);
                controller._deleteQuestion(questionNumber);
            });
        }
    }

    /**
     * This attaches event handlers to the import page.
     *
     * @private
     */
    _attachImportHandlers() {
        let controller = this;
        $('#importSourceUrl').click(() => {
            controller._clearMessage();
            controller._importSourceUrlClick();
        });
        $('#importSourceTextArea').click(() => {
            controller._clearMessage();
            controller._importSourceTextAreaClick();
        });
        $('#btnImport').click(function() {
            controller._clearMessage();
            controller._importSettings();
        });
    }

    /**
     * This attaches event handlers to the export page.
     *
     * @private
     */
    _attachExportHandlers() {
        $(`input[name="addQuestions"]`).click(() => {
            if ($(`input[name="addQuestions"]`).is(':checked')) {
                $("#btnNext").text(Context.y18n.__("Add Questions"));
                $("#btnNext").attr("href", "#Settings/saveAndGoToQuestions");
            } else {
                $("#btnNext").text(Context.y18n.__("Export"));
                $("#btnNext").attr("href", "#Settings/showExportJson");
            }
        })
        $('#btnReset').click(() => {
            if(confirm(Context.y18n.__("Do you want to clear this form and remove questions related to these settings?"))){
                location.href = '#Settings/reset';
            }
        })
    }

    /**
     * Adds a new, blank question to the export questions form.
     *
     * @private
     */
    _addQuestion() {
        this.questionsForm.parseQuestionsForExport();
        this.questionsForm.obj.questions.push(new ExportQuestion());
        this.questionsForm.obj.save();
        this.redirect("Settings", "showQuestionsForm", this.params);
    }

    /**
     * Adds a new, blank question to the export questions form.
     *
     * @private
     */
    _deleteQuestion(questionNumber) {
        this.questionsForm.parseQuestionsForExport();
        this.questionsForm.obj.questions.splice(questionNumber, 1);
        this.questionsForm.obj.save();
        this.redirect("Settings", "showQuestionsForm", this.params);
    }

    /**
     * Attaches callbacks after the export questions form is rendered.
     *
     * @private
     */
    _attachQuestionCallbacks(rowNumber) {
        let controller = this;
        // When selected object type changes, update the object names list.
        $(`select[data-control-type=object-type][data-row-number=${rowNumber}]`).change(function() {
            let namesList = controller.questionsForm.getNamesList(rowNumber);
            $(`#objId_${rowNumber}`).empty();
            $(`#objId_${rowNumber}`).append(new Option());
            for (let opt of namesList) {
                $(`#objId_${rowNumber}`).append(new Option(opt.name, opt.id));
            }
        });
        // When selected object name changes, updated the fields list.
        $(`select[data-control-type=object-name][data-row-number=${rowNumber}]`).change(function() {
            let fieldsList = controller.questionsForm.getFieldsList(rowNumber);
            $(`#field_${rowNumber}`).empty();
            $(`#field_${rowNumber}`).append(new Option());
            for (let opt of fieldsList) {
                $(`#field_${rowNumber}`).append(new Option(opt.name, opt.id));
            }
        });
    }


    /**
     * This calls the correct function to import DART settings based
     * on the input source (URL or text area).
     *
     * @private
     */
    _importSettings() {
        var importSource = $("input[name='importSource']:checked").val();
        if (importSource == 'URL') {
            this._importSettingsFromUrl($("#txtUrl").val());
        } else if (importSource == 'TextArea') {
            this._importWithErrHandling($("#txtJson").val(), null);
        }
    }

    /**
     * Imports settings from the URL the user specified.
     *
     * @private
     */
    _importSettingsFromUrl(settingsUrl) {
        let controller = this;
        try {
            new url.URL(settingsUrl);
        } catch (ex) {
            controller._showError(Context.y18n.__("Please enter a valid URL."));
            return;
        }
        request(settingsUrl, function (error, response, body) {
            if (error) {
                let msg = Context.y18n.__("Error retrieving profile from %s: %s", settingsUrl, error);
                Context.logger.error(msg);
                controller._showError(msg);
            } else if (response && response.statusCode == 200) {
                // TODO: Make sure response is JSON, not HTML.
                controller._importWithErrHandling(body, settingsUrl);
            } else {
                let statusCode = (response && response.statusCode) || Context.y18n.__('Unknown');
                let msg = Context.y18n.__("Got response %s from %s", statusCode, settingsUrl);
                Context.logger.error(msg);
                controller._showError(msg);
            }
        });
    }

    /**
     * This wraps the import process in a general error handler.
     *
     * @private
     */
    _importWithErrHandling(json, settingsUrl) {
        try {
            this._importSettingsJson(json, settingsUrl);
            this._showSuccess(Context.y18n.__("DART successfully imported the settings."));
            return true;
        } catch (ex) {
            let msg = Context.y18n.__("Error importing settings: %s", ex);
            Context.logger.error(msg);
            Context.logger.error(ex);
            this._showError(msg);
            return false;
        }
    }

    /**
     * This performs the actual import of the settings. It may throw
     * any number of errors, which must be handled by the caller.
     *
     * @private
     */
    _importSettingsJson(json, settingsUrl) {
        let obj;
        try {
            obj = JSON.parse(json);
        } catch (ex) {
            let msg = Context.y18n.__("Error parsing JSON: %s. ", ex.message || ex);
            if (settingsUrl) {
                msg += Context.y18n.__("Be sure the URL returned JSON, not HTML.");
            }
            throw msg;
        }
        this._importSettingsList(obj.appSettings, 'App Setting');
        this._importSettingsList(obj.bagItProfiles, 'BagIt Profile');
        this._importSettingsList(obj.remoteRepositories, 'Remote Repository');
        this._importSettingsList(obj.storageServices, 'Storage Service');
    }

    /**
     * Imports a list of settings from the parsed JSON object.
     *
     * @private
     */
    _importSettingsList(list, objType) {
        if (!Array.isArray(list)) {
            return;
        }
        for (let obj of list) {
            let fullObj = this._inflateObject(obj, objType);
            if (fullObj.validate()) {
                fullObj.save()
            } else {
                controller._showError(Context.y18n.__(
                    "Error importing %s '%s': %s",
                    objType, obj.name, fullObj.errors.join("\n\n")));
            }
        }
    }

    /**
     * Converts a vanilla object to a typed object.
     *
     * @param {Object} obj - An untyped JavaScript object (usually parsed
     * from JSON).
     *
     * @param {string} objType - The type to which to convert the object.
     *
     * @private
     */
    _inflateObject(obj, objType) {
        let fullObj = null;
        switch (objType) {
            case 'App Setting':
              fullObj = AppSetting.inflateFrom(obj);
              break;
            case 'BagIt Profile':
              fullObj = BagItProfile.inflateFrom(obj);
              break;
            case 'Remote Repository':
              fullObj = RemoteRepository.inflateFrom(obj);
              break;
            case 'Storage Service':
              fullObj = StorageService.inflateFrom(obj);
              break;
            break;
        default:
            throw `Unknown setting type: ${objType}`
        }
        return fullObj;
    }

    /**
     * Copies exported settings (JSON) to the system clipboard.
     *
     * @private
     */
    _copyToClipboard() {
        var copyText = document.querySelector("#txtJson");
        copyText.select();
        document.execCommand("copy");
        $("#copied").show();
        $("#copied").fadeOut({duration: 1800});
    }

    /**
     * Displays a success message.
     *
     * @private
     */
    _showSuccess(message) {
        $('#result').hide();
        $('#result').removeClass('text-danger');
        $('#result').addClass('text-success');
        $('#result').text(message);
        $('#result').show();
    }

    /**
     * Displays an error message
     *
     * @private
     */
    _showError(message) {
        $('#result').hide();
        $('#result').addClass('text-danger');
        $('#result').removeClass('text-success');
        $('#result').text(message);
        $('#result').show();
    }

    /**
     * Clears any success/error message from the display.
     *
     * @private
     */
    _clearMessage() {
        $('#result').hide();
        $('#result').text('');
    }
}

module.exports.SettingsController = SettingsController;
