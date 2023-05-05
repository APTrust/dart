const $ = require('jquery');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { Choice } = require('./choice');
const { Context } = require('../../core/context');
const { ExportQuestion } = require('../../core/export_question');
const { Field } = require('./field');
const { Form } = require('./form');

/**
 * SettingsQuestionsForm allows the user to specify where Job
 * files will be uploaded. This is a highly customized descendant
 * of the base {@link Form} and does not behave like most others
 * because it requires questions to be logically grouped and
 * repeated.
 *
 */
class SettingsQuestionsForm extends Form {

    /**
     * Creates a new form to display export questions.
     *
     * @param {ExportSettings} exportSettings
     */
    constructor(exportSettings) {
        super('SettingsQuestions', exportSettings);
        this.fieldsForType = {};
        this.fieldsForType['AppSetting'] = [
            "value"
        ];
        this.fieldsForType['RemoteRepository'] = [
            "apiToken",
            "loginExtra",
            "name",
            "url",
            "userId"
        ];
        this.fieldsForType['StorageService'] = [
            "bucket",
            "description",
            "host",
            "login",
            "loginExtra",
            "name",
            "password",
            "port",
            "protocol"
        ];
        this.rowCount = 0;
        this._init();
    }

    /**
     * Initializes the form by creating the necessary fields and
     * populating them with pre-existing data.
     *
     * @private
     */
    _init() {
        let questionsToShow = this.obj.questions.length || 1;
        for(let i=0; i < questionsToShow; i++) {
            this.addRow();
        }
    }

    /**
     * Adds one new question to the form. The question takes up one
     * row in the display.
     *
     */
    addRow() {
        let row = {
            prompt: this._addPrompt(),
            objType: this._addObjType(),
            objId: this._addObjId(),
            field: this._addField(),
        }
        this.rowCount += 1;
        return row;
    }

    /**
     * Adds a form field for a question.prompt.
     *
     * @private
     */
    _addPrompt() {
        let prompt = `prompt_${this.rowCount}`
        let question = this.obj.questions[this.rowCount];
        let value = question ? question.prompt : "";
        this.fields[prompt] = new Field(
            prompt,
            prompt,
            Context.y18n.__("Question"),
            value
        );
        this.fields[prompt].attrs = {
            "data-row-number": this.rowCount,
            "data-control-type": "prompt"
        }
        return this.fields[prompt];
    }

    /**
     * Adds a form field for question.objType.
     *
     * @private
     */
    _addObjType() {
        let objType = `objType_${this.rowCount}`
        let question = this.obj.questions[this.rowCount];
        let value = question ? question.objType : "";
        this.fields[objType] = new Field(
            objType,
            objType,
            Context.y18n.__("Object Type"),
            value
        );
        let objTypeOptions = [];
        if (this.obj.appSettings.length > 0) {
            objTypeOptions.push({
                id: "AppSetting",
                name: Context.y18n.__("App Setting")
            });
        }
        if (this.obj.bagItProfiles.length > 0) {
            objTypeOptions.push({
                id: "BagItProfile",
                name: Context.y18n.__("BagIt Profile")
            });
        }
        if (this.obj.remoteRepositories.length > 0) {
            objTypeOptions.push({
                id: "RemoteRepository",
                name: Context.y18n.__("Remote Repository")
            });
        }
        if (this.obj.storageServices.length > 0) {
            objTypeOptions.push({
                id: "StorageService",
                name: Context.y18n.__("Storage Service")
            });
        }
        this.fields[objType].choices = Choice.makeList(
            objTypeOptions,
            value,
            true
        );
        this.fields[objType].attrs = {
            "data-row-number": this.rowCount,
            "data-control-type": "object-type"
        }
        return this.fields[objType];
    }

    /**
     * Adds a form field for question.objId.
     *
     * @private
     */
    _addObjId() {
        let objId = `objId_${this.rowCount}`
        let question = this.obj.questions[this.rowCount];
        let value = "";
        let options = [];
        if (question != null) {
            value = question.objId;
        }
        this.fields[objId] = new Field(
            objId,
            objId,
            Context.y18n.__("Object Name"),
            value
        );
        if (question != null) {
            options = this.getNamesList(this.rowCount);
        }
        this.fields[objId].choices = Choice.makeList(
            options,
            value,
            true);
        this.fields[objId].attrs = {
            "data-row-number": this.rowCount,
            "data-control-type": "object-name"
        }
        return this.fields[objId];
    }

    /**
     * Adds a form field for question.field.
     *
     * @private
     */
    _addField() {
        let field = `field_${this.rowCount}`
        let question = this.obj.questions[this.rowCount];
        let value = "";
        let options = [];
        if (question != null) {
            value = question.field;
        }
        this.fields[field] = new Field(
            field,
            field,
            Context.y18n.__("Field"),
            value
        );
        if (question != null) {
            options = this.getFieldsList(this.rowCount);
        }
        this.fields[field].choices = Choice.makeList(
            options,
            value,
            true);
        this.fields[field].attrs = {
            "data-row-number": this.rowCount,
            "data-control-type": "field"
        }
        return this.fields[field];
    }

    /**
     * Returns a list of questions as an array. Each question consists
     * of four fields (prompt, objType, objId, and field). We need this
     * to pass questions to the HTML templates that render them.
     *
     */
    getQuestionsAsArray() {
        let form = this;
        let questions = []
        for (let i = 0; i < this.rowCount; i++) {
            questions.push({
                prompt: form.fields[`prompt_${i}`],
                objType: form.fields[`objType_${i}`],
                objId: form.fields[`objId_${i}`],
                field: form.fields[`field_${i}`],
            });
        }
        return questions;
    }

    /**
     * Returns the user's response to quesion.prompt in the specified row.
     *
     * @returns {string}
     */
    getQuestionPrompt(rowNumber) {
        return $(`#prompt_${rowNumber}`).val();
    }

    /**
     * Returns the user's response to quesion.objType in the specified row.
     *
     * @returns {string}
     */
    getSelectedType(rowNumber) {
        let element = $(`#objType_${rowNumber}`);
        return element.length > 0 ? element.val() : this.fields[`objType_${rowNumber}`].value;
    }

    /**
     * Returns the user's response to quesion.objId in the specified row.
     *
     * @returns {string}
     */
    getSelectedId(rowNumber) {
        let element = $(`#objId_${rowNumber}`);
        return element.length > 0 ? element.val() : this.fields[`objId_${rowNumber}`].value;
    }

    /**
     * Returns the user's response to quesion.field in the specified row.
     *
     * @returns {string}
     */
    getSelectedField(rowNumber) {
        let element = $(`#field_${rowNumber}`);
        return element.length > 0 ? element.val() : this.fields[`field_${rowNumber}`].value;
    }

    /**
     * Returns the user's response to quesion in the specified row. Returns
     * an object that includes prompt, objType, objId, field.
     *
     * @returns {ExportQuestion}
     */
    getQuestionFromForm(rowNumber) {
        let form = this;
        return new ExportQuestion({
            prompt: form.getQuestionPrompt(rowNumber),
            objType: form.getSelectedType(rowNumber),
            objId: form.getSelectedId(rowNumber),
            field: form.getSelectedField(rowNumber),
        });
    }

    /**
     * Returns a list of names to display in the objId form field.
     * Each option value is a UUID. The text is a name.
     *
     * @returns {Array<object>}
     */
    getNamesList(rowNumber) {
        let selectedType = this.getSelectedType(rowNumber);
        if (!selectedType) {
            return [];
        }
        let listName = ExportQuestion.listNameFor(selectedType);
        return this.obj[listName].map(obj => { return { id: obj.id, name: obj.name }});
    }

    /**
     * Returns a list of field names to display in the form's "field"
     * select list.
     *
     * @returns {Array<string>}
     */
    getFieldsList(rowNumber) {
        let selectedType = this.getSelectedType(rowNumber);
        if (!selectedType) {
            return [];
        }
        if (selectedType == "BagItProfile") {
            let profileId = this.getSelectedId(rowNumber);
            let profile = BagItProfile.find(profileId);
            if (profile == null) {
                return [];
            }
            let opts =  profile.tags.filter(tagDef => !tagDef.systemMustSet()).map(tag => {return { id: tag.id, name: tag.tagName }});
            return opts.sort((x,y) => {
                if (x.name < y.name) {
                    return -1;
                }
                if (x.name > y.name) {
                    return 1;
                }
                return 0;
            });
        }
        return this.fieldsForType[selectedType].map(name => { return { id: name, name: name }});
    }

    /**
     * Returns a list of ExportQuestions parsed from the HTML form.
     *
     * @returns {Array<ExportQuestion>}
     */
    parseQuestionsForExport() {
        this.obj.questions = [];
        let count = $("div[data-question-number]").length;
        for (let i=0; i < count; i++) {
            this.obj.questions.push(this.getQuestionFromForm(i));
        }
    }

}

module.exports.SettingsQuestionsForm = SettingsQuestionsForm;
