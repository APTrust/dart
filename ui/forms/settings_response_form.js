const $ = require('jquery');
const { AppSetting } = require('../../core/app_setting');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { Choice } = require('./choice');
const { Context } = require('../../core/context');
const { ExportQuestion } = require('../../core/export_question');
const { Field } = require('./field');
const { Form } = require('./form');
const { RemoteRepository } = require('../../core/remote_repository');
const { StorageService } = require('../../core/storage_service');
const { Util } = require('../../core/util');

/**
 * SettingsResponseForm allows the user answer questions during
 * the settings import process.
 */
class SettingsResponseForm extends Form {

    /**
     * Creates a new form for import questions.
     *
     */
    constructor(exportSettings) {
        super('ExportSettings', exportSettings);
        this._init();
    }

    _init() {
        // Delete default fields from the base constructor.
        this.fields = {};
        for (let q of this.obj.questions) {
            this.fields[q.id] = new Field(
                q.id,
                q.id,
                q.prompt,
                ""
            );
            // If this field will contain sensitive data,
            // mask it (i.e. present it as a password field).
            if (q.field == "password") {
                this.fields[q.id].attrs["maskField"] = true
            }
        }
    }

    preloadValues() {
        for (let q of this.obj.questions) {
            let question = new ExportQuestion(q);
            this.fields[q.id].value = question.tryToGetValue();
        }

    }

    /**
     * Returns responses in the form of a hash. Keys are question
     * ids. Values are user responses. Both are string type.
     *
     * @returns {object}
     */
    getResponses() {
        let responses = {};
        for (let q of this.obj.questions) {
            responses[q.id] = $(`#${q.id}`).val();
        }
        return responses;
    }
}

module.exports.SettingsResponseForm = SettingsResponseForm;
