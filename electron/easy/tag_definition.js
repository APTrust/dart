const path = require('path');
const Choice = require(path.resolve('electron/easy/choice'));
const Const = require(path.resolve('electron/easy/constants'));
const Form = require(path.resolve('electron/easy/form'));
const Field = require(path.resolve('electron/easy/field'));
const Util = require(path.resolve('electron/easy/util'));
const ValidationResult = require(path.resolve('electron/easy/validation_result'));


module.exports = class TagDefinition {
    constructor(tagFile, tagName) {
        this.id = Util.uuid4();
        this.tagFile = tagFile;
        this.tagName = tagName;
        this.required = false;
        this.emptyOk = true;
        this.values = [];
        this.defaultValue = "";
        this.isBuiltIn = false;
    }
    validate() {
        var result = new ValidationResult();
        if (this.values.length > 0 && !Util.listContains(this.values, this.defaultValue)) {
            result.errors['defaultValue'] = "The default value must be one of the allowed values.";
        }
        return result
    }
    toForm() {
        var form = new Form("");
        form.fields['tagFile'] = new Field('tagFile', 'tagFile', 'Tag File', this.tagFile)
        form.fields['tagName'] = new Field('tagName', 'tagName', 'Tag Name', this.tagName)
        form.fields['required'] = new Field('required', 'required', 'Presence Required?', this.required)
        form.fields['required'].choices = Choice.makeList(Const.YesNo, this.required, false);
        form.fields['required'].help = "Does this tag have to be present in the tag file?";
        form.fields['emptyOk'] = new Field('emptyOk', 'emptyOk', 'Can tag value be empty?', this.emptyOk)
        form.fields['emptyOk'].choices = Choice.makeList(Const.YesNo, this.emptyOk, false);
        form.fields['emptyOk'].help = "Is it valid for this tag to be present but empty?";
        form.fields['values'] = new Field('values', 'values', 'Allowed Values (one per line)', this.values.join("\n"))
        form.fields['values'].help = "List the legal values for this tag, one per line. Leave this field empty to allow any value.";
        form.fields['defaultValue'] = new Field('defaultValue', 'defaultValue', 'Default Value', this.defaultValue)
        form.fields['defaultValue'].help = "Optional default value for this field. If this tag has a list of allowed values, the default value must be one of the allowed values.";
        form.fields['tagDefinitionId'] = new Field('tagDefinitionId', 'tagDefinitionId', 'tagDefinitionId', this.id)

        // Don't let users edit anything but default value if this
        // tag definition is a native part of a built-in form.
        var readOnly = ['tagFile',
                        'tagName',
                        'required',
                        'emptyOk',
                        'values'];
        if (this.isBuiltIn) {
            for (var name of readOnly) {
                form.fields[name].attrs['disabled'] = true;
            }
        }

        return form;
    }
    static fromForm() {
        var tagName = $('#tagName').val().trim();
        var tagFile = $('#tagFile').val().trim();
        var tagDef = new TagDefinition(tagFile, tagName);
        tagDef.required = $('#required').val().trim();
        tagDef.emptyOk = $('#emptyOk').val().trim();
        tagDef.values = Util.filterEmpties($('#values').val().split("\n"));
        tagDef.defaultValue = $('#defaultValue').val().trim();
        tagDef.id = $('#tagDefinitionId').val().trim();
        return tagDef;
    }
}
