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

let appSettingName = Context.y18n.__("App Setting");
let bagItProfileName = Context.y18n.__("BagIt Profile");
let remoteRepositoryName = Context.y18n.__("Remote Repository");
let storageServiceName = Context.y18n.__("Storage Service");

/**
 * SettingsQuestionsForm allows the user to specify where Job
 * files will be uploaded. This is a highly customized descendant
 * of the base {@link Form} and does not behave like most others
 * because it requires questions to be logically grouped and
 * repeated.
 *
 */
class SettingsQuestionsForm extends Form {

    constructor(data) {
        super('SettingsQuestions', data);
        this.listNames = {};
        this.listNames[appSettingName] = "appSettings";
        this.listNames[bagItProfileName] = "bagItProfiles";
        this.listNames[remoteRepositoryName] = "remoteRepositories";
        this.listNames[storageServiceName] = "storageServices";
        this.fieldsForType = {};
        this.fieldsForType[appSettingName] = [
            "value"
        ];
        this.fieldsForType[remoteRepositoryName] = [
            "apiToken",
            "loginExtra",
            "name",
            "url",
            "userId"
        ];
        this.fieldsForType[storageServiceName] = [
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
        this._init(data);
    }

    _init() {
        this.addRow();
    }

    getSelectedItems() {
        //this.parseFromDOM();
    }

    addRow() {
        this._addPrompt();
        this._addObjType();
        this._addObjName();
        this._addField();
        this.rowCount += 1;
    }

    _addPrompt() {
        let prompt = `prompt_${this.rowCount}`
        this.fields[prompt] = new Field(
            prompt,
            prompt,
            Context.y18n.__("Question"),
            ""
        );
        this.fields[prompt].attrs = {
            "data-row-number": this.rowCount,
            "data-control-type": "prompt"
        }

    }

    _addObjType() {
        let objType = `objType_${this.rowCount}`
        this.fields[objType] = new Field(
            objType,
            objType,
            Context.y18n.__("Object Type"),
            ""
        );
        let objTypeOptions = [];
        if (this.obj.appSettings.length > 0) {
            objTypeOptions.push(Context.y18n.__("App Setting"));
        }
        if (this.obj.bagItProfiles.length > 0) {
            objTypeOptions.push(Context.y18n.__("BagIt Profile"));
        }
        if (this.obj.remoteRepositories.length > 0) {
            objTypeOptions.push(Context.y18n.__("Remote Repository"));
        }
        if (this.obj.storageServices.length > 0) {
            objTypeOptions.push(Context.y18n.__("Storage Service"));
        }
        this.fields[objType].choices = Choice.makeList(
            objTypeOptions,
            null,
            true
        );
        this.fields[objType].attrs = {
            "data-row-number": this.rowCount,
            "data-control-type": "object-type"
        }
    }

    _addObjName() {
        let objName = `objName_${this.rowCount}`
        this.fields[objName] = new Field(
            objName,
            objName,
            Context.y18n.__("Object Name"),
            ""
        );
        this.fields[objName].choices = Choice.makeList([], [], true);
        this.fields[objName].attrs = {
            "data-row-number": this.rowCount,
            "data-control-type": "object-name"
        }
    }

    _addField() {
        let field = `field_${this.rowCount}`
        this.fields[field] = new Field(
            field,
            field,
            Context.y18n.__("Field"),
            ""
        );
        this.fields[field].choices = Choice.makeList([], [], true);
        this.fields[field].attrs = {
            "data-row-number": this.rowCount,
            "data-control-type": "field"
        }
    }

    getQuestionsAsArray() {
        let form = this;
        let questions = []
        for (let i = 0; i < this.rowCount; i++) {
            questions.push({
                prompt: form.fields[`prompt_${i}`],
                objType: form.fields[`objType_${i}`],
                objName: form.fields[`objName_${i}`],
                field: form.fields[`field_${i}`],
            });
        }
        return questions;
    }

    getQuestionPrompt(rowNumber) {
        return $(`#prompt_${rowNumber}`).val();
    }

    getSelectedType(rowNumber) {
        return $(`#objType_${rowNumber}`).val();
    }

    getSelectedName(rowNumber) {
        return $(`#objName_${rowNumber}`).val();
    }

    getSelectedField(rowNumber) {
        return $(`#field_${rowNumber}`).val();
    }

    getQuestionFromForm(rowNumber) {
        let form = this;
        return new ExportQuestion({
            prompt: form.getQuestionPrompt(rowNumber),
            objType: form.getSelectedType(rowNumber),
            objId: form.getSelectedName(rowNumber),
            field: form.getSelectedField(rowNumber),
        });
    }

    getNamesList(rowNumber) {
        let selectedType = this.getSelectedType(rowNumber);
        let listName = this.listNames[selectedType];
        return this.obj[listName].map(obj => { return { id: obj.id, name: obj.name }});
    }

    getFieldsList(rowNumber) {
        let selectedType = this.getSelectedType(rowNumber);
        if (selectedType == Context.y18n.__("BagIt Profile")) {
            let profileId = this.getSelectedName(rowNumber);
            let profile = BagItProfile.find(profileId);
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

    parseQuestionsForExport() {
        this.obj.questions = [];
        let count = $("div[data-question-number]").length;
        for (let i=0; i < count; i++) {
            this.obj.questions.push(this.getQuestionFromForm(i));
        }
        console.log(this.obj.questions);
    }

}

module.exports.SettingsQuestionsForm = SettingsQuestionsForm;
