const path = require('path');
const Choice = require(path.resolve('electron/easy/core/choice'));
const Const = require(path.resolve('electron/easy/core/constants'));
const Form = require(path.resolve('electron/easy/core/form'));
const Field = require(path.resolve('electron/easy/core/field'));
const Util = require(path.resolve('electron/easy/core/util'));
const ValidationResult = require(path.resolve('electron/easy/core/validation_result'));


module.exports = class TagDefinition {
    constructor(tagFile, tagName) {
        this.id = Util.uuid4();
        this.tagFile = tagFile;
        this.tagName = tagName;
        this.required = false;
        this.emptyOk = false;
        this.values = [];
        this.defaultValue = "";
        this.userValue = "";

        // help tells the user what the tag means.
        this.help = "";

        // isBuiltIn flag is true for built-in tags whose
        // definition should not be altered or even changeable
        // by the user.
        this.isBuiltIn = false;

        // addedForJob is a special flag for tags belonging
        // to custom tag files that were added for a specific
        // job. The UI handles these a little differently.
        this.addedForJob = false;
    }
    objectType() {
        return 'TagDefinition';
    }
    validate() {
        var result = new ValidationResult();
        if (this.values.length > 0 && !Util.listContains(this.values, this.defaultValue)) {
            result.errors['defaultValue'] = "The default value must be one of the allowed values.";
        }
        return result
    }
    validateForJob() {
        var errors = [];
        var tagIsEmpty = (this.userValue == null || this.userValue == "");
        if (this.tagRequired && !this.emptyOk) {
            errors.push(`Tag ${this.tagName} in file ${this.tagFile} cannot be empty.`);
        } else if (this.values.length > 0 && !Util.listContains(this.values, this.userValue)) {
            errors.push(`Tag ${this.tagName} in file ${this.tagFile} has a value that is not on the list of allowed values.`);
        }
        return errors;
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
        if (this.values != null && this.values.length > 0) {
            var defaultVal = "";
            if (this.values.length == 1) {
                defaultVal = this.values[0];
            }
            form.fields['defaultValue'].choices = Choice.makeList(this.values, defaultVal, true)
        }
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
        if (this.systemMustSet()) {
            form.fields['defaultValue'].attrs['disabled'] = true;
            form.fields['defaultValue'].help = this.help + " You cannot set this tag value manually. The system will set it internally each time it generates a bag.";
        }

        return form;
    }
    static fromForm() {
        var tagName = $('#tagName').val().trim();
        var tagFile = $('#tagFile').val().trim();
        var tagDef = new TagDefinition(tagFile, tagName);
        tagDef.required = Util.boolValue($('#required').val().trim());
        tagDef.emptyOk = Util.boolValue($('#emptyOk').val().trim());
        tagDef.values = Util.filterEmpties($('#values').val().split("\n"));
        tagDef.defaultValue = $('#defaultValue').val().trim();
        tagDef.id = $('#tagDefinitionId').val().trim();
        return tagDef;
    }
    toFieldForJobForm() {
        var field = new Field(this.id, this.tagName, this.tagName, this.getValue());
        if (this.values) {
            field.choices = Choice.makeList(this.values, this.getValue(), true);
        }
        if (this.systemMustSet()) {
            field.help = this.help + " The system will set this field's value when it creates the bag.";
            field.attrs['disabled'] = true;
        }
        if (this.required && !this.emptyOk) {
            field.attrs['required'] = true;
            field.cssClasses.push('required');
        }
        return field;
    }
    systemMustSet() {
        return (this.tagName == 'Bagging-Date' || this.tagName == 'Payload-Oxum');
    }
    getValue() {
        return this.userValue || this.defaultValue;
    }
    looksLikeDescriptionTag() {
        return this.tagName.toLowerCase().includes("description");
    }
}
