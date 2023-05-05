const { Choice } = require('./choice');
const { Constants } = require('../../core/constants');
const { Form } = require('./form');

class TagDefinitionForm extends Form {

    constructor(tagDefinition) {
        // On this form, we do include 'required'
        super('TagDefinition', tagDefinition, ['errors', 'type', 'wasAddedForJob']);
        this._init();
    }

    _init() {
        if (this.obj.isBuiltIn) {
            this.fields['tagName'].attrs['disabled'] = true;
            this.fields['tagFile'].attrs['disabled'] = true;
        }

        // For some tag definitions, the 'values' attribute contains a list
        // of allowed values. If this is the case, make them appear on
        // seperate lines of the textarea on the form.
        if (this.fields.values.value && Array.isArray(this.fields.values.value) && this.fields.values.value.length > 0) {
            this.fields['values'].value = this.fields['values'].value.join("\n").trim();
            this.fields['defaultValue'].choices = Choice.makeList(
                this.obj.values,
                this.obj.defaultValue,
                true);
        }

        this.fields['required'].choices = Choice.makeList(
            Constants.YES_NO,
            this.obj.required,
            false);
    }

}

module.exports.TagDefinitionForm = TagDefinitionForm;
