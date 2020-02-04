const $ = require('jquery');
const { AppSetting } = require('../../core/app_setting');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { BaseController } = require('./base_controller');
const { Context } = require('../../core/context');
const Dart = require('../../core');
const { RemoteRepository } = require('../../core/remote_repository');
const request = require('request');
const { SettingsExportForm } = require('../forms/settings_export_form');
const { StorageService } = require('../../core/storage_service');
const Templates = require('../common/templates');
const url = require('url');

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
        let form = new SettingsExportForm();
        let data = { form: form };
        let html = Templates.settingsExport(data);
        return this.containerContent(html);
    }

    /**
     * Shows the exported settings in JSON format in a modal dialog.
     *
     */
    showExportJson() {
        let form = new SettingsExportForm();
        let items = form.getSelectedItems();
        let title = Context.y18n.__("Exported Settings");
        let body = Templates.settingsExportResult({
            json: JSON.stringify(items, this._jsonFilter, 2)
        });
        return this.modalContent(title, body);
    }

    /**
     * Filters some security-sensitive and/or unnecessary settings from
     * JSON output. This will replace fields 'login', 'password', 'userId',
     * and 'apiToken' with empty strings unless the values begin with 'env:',
     * which indicates they are environment variables.
     *
     * @private
     */
    _jsonFilter(key, value) {
        let unsafe = ['login', 'password', 'userId', 'apiToken']
        if (unsafe.includes(key)) {
            if (!value.startsWith('env:')) {
                value = '';
            }
        }
        let exclude = ['userCanDelete', 'errors']
        if (exclude.includes(key)) {
            value = undefined;
        }
        // This is specific to DART PersistentObjects:
        // suppress serialization of the required attrs array.
        // We DO want to export required = true/false
        // on BagItProfile TagDefinition objects.
        if (key == 'required' && Array.isArray(value)) {
            value = undefined;
        }
        return value;
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
            $('#importSourceUrl').click(this._importSourceUrlClick);
            $('#importSourceTextArea').click(this._importSourceTextAreaClick);
            $('#btnImport').click(function() { controller._importSettings() });
        } else if (fnName == 'showExportJson') {
            $('#btnCopyToClipboard').click(function() { controller._copyToClipboard() });
        }
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
            this._importSettingsFromUrl();
        } else if (importSource == 'TextArea') {
            this._importSettingsFromTextArea();
        }
    }

    /**
     * Imports settings from the URL the user specified.
     *
     * @private
     */
    _importSettingsFromUrl() {
        let controller = this;
        let settingsUrl = $("#txtUrl").val();
        try {
            new url.URL(settingsUrl);
        } catch (ex) {
            alert(Context.y18n.__("Please enter a valid URL."));
        }
        request(settingsUrl, function (error, response, body) {
            if (error) {
                let msg = Context.y18n.__("Error retrieving profile from %s: %s", settingsUrl, error);
                Context.logger.error(msg);
                alert(msg);
            } else if (response && response.statusCode == 200) {
                // TODO: Make sure response is JSON, not HTML.
                controller._importWithErrHandling(body, settingsUrl);
            } else {
                let statusCode = (response && response.statusCode) || Context.y18n.__('Unknown');
                let msg = Context.y18n.__("Got response %s from %s", statusCode, settingsUrl);
                Context.logger.error(msg);
                alert(msg);
            }
        });
    }

    /**
     * Imports settings from the JSON in the textarea.
     *
     * @private
     */
    _importSettingsFromTextArea() {
        let settingsJson = $("#txtJson").val();
        this._importWithErrHandling(settingsJson, null);
    }


    /**
     * This wraps the import process in a general error handler.
     *
     * @private
     */
    _importWithErrHandling(json, settingsUrl) {
        try {
            this._importSettingsJson(json, settingsUrl);
            alert(Context.y18n.__("DART successfully imported the settings."));
            return true;
        } catch (ex) {
            let msg = Context.y18n.__("Error importing settings: %s", ex);
            Context.logger.error(msg);
            Context.logger.error(ex);
            alert(msg);
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
                alert(Context.y18n.__(
                    "Error importing %s '%s': %s",
                    objType, obj.name, fullObj.errors.join("\n\n")));
            }
        }
    }

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

    _copyToClipboard() {
        var copyText = document.querySelector("#txtJson");
        copyText.select();
        document.execCommand("copy");
        $("#copied").show();
        $("#copied").fadeOut({duration: 1800});
    }
}

module.exports.SettingsController = SettingsController;
