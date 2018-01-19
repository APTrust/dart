const path = require('path');
const Choice = require('./choice');
const Const = require('./constants');
const Form = require('./form');
const Field = require('./field');
const Util = require('./util');
const ValidationResult = require('./validation_result');

const tagsSetBySystem = ['Bagging-Date', 'Payload-Oxum', 'DPN-Object-ID',
                         'First-Version-Object-ID', 'Bag-Size'];

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
        form.fields['help'] = new Field('tagDefHelp', 'tagDefHelp', 'Help Text', this.help);
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
                        'values',
                        'help'];
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
        tagDef.help = $('#tagDefHelp').val().trim();
        tagDef.id = $('#tagDefinitionId').val().trim();
        return tagDef;
    }
    toFieldForJobForm() {
        var field = new Field(this.id, this.tagName, this.tagName, this.getValue());
        field.help = this.help;
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
        // We can't set this in the profile JSON unless we have internal
        // code to actually set the tag value. For now, we'll add to
        // tagsSetBySystem (defined above) as we can.
        return Util.listContains(tagsSetBySystem, this.tagName);
    }
    getValue() {
        return this.userValue || this.defaultValue;
    }
    looksLikeDescriptionTag() {
        return this.tagName.toLowerCase().includes("description");
    }
}
