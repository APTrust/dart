const { TagDefinition } = require('../../bagit/tag_definition');
const { Choice } = require('./choice');
const { Field } = require('./field');
const { Form } = require('./form');

class TagDefinitionForm extends Form {

    constructor(tagDefinition) {
        // On this form, we do include 'required'
        super('tagDefinitionForm', tagDefinition,  ['errors', 'type']);
        this._init();
    }

    _init() {
        if (!this.obj.isBuiltIn) {
            this.fields['tagName'].attrs['disabled'] = true;
            this.fields['tagFile'].attrs['disabled'] = true;
        }

        // For some tag definitions, the 'values' attribute contains a list
        // of allowed values. If this is the case, make them appear on
        // seperate lines of the textarea on the form.
        if (this.fields.values.value && Array.isArray(this.fields.values.value)) {
            this.fields['values'].value = this.fields['values'].value.join("\n").trim();
        }
    }

}

module.exports.TagDefinitionForm = TagDefinitionForm;
