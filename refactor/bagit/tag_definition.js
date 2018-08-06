const { Util } = require('./util');
const { ValidationResult } = require('./validation_result');

const tagsSetBySystem = ['Bagging-Date', 'Bagging-Software',
                         'Payload-Oxum', 'DPN-Object-ID',
                         'First-Version-Object-ID', 'Bag-Size'];

class TagDefinition {
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
    // toFormattedString returns the tag as string in a format suitable
    // for writing to a tag file. Following LOC's bagit.py, this function
    // does not break lines into 79 character chunks. It prints the whole
    // tag on a single line, replacing newlines with spaces.
    toFormattedString() {
        var val = (this.userValue || this.defaultValue || "").replace(/(\r\n)|\n|\r/, ' ');
        return `${this.tagName}: ${val}`;
    }
}

module.exports.TagDefinition = TagDefinition;
