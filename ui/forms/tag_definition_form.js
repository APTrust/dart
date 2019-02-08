const { TagDefinition } = require('../../bagit/tag_definition');
const { Choice } = require('./choice');
const { Field } = require('./field');
const { Form } = require('./form');

class TagDefinitionForm extends Form {

    constructor(tagDefinition) {
        // On this form, we do include 'required'
        super('tagDefinitionForm', tagDefinition,  ['errors', 'help', 'type']);
        this._init();
    }

    _init() {
        if (!this.obj.isBuiltIn) {
            this.fields['tagName'].attrs['disabled'] = true;
            this.fields['tagFile'].attrs['disabled'] = true;
        }
    }

}

module.exports.TagDefinitionForm = TagDefinitionForm;
