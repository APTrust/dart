const { Util } = require('../core/util');
const { ValidationResult } = require('../core/validation_result');

/**
 * This is a list of BagIt tags that the system sets internally
 * when it creates a bag.
 *
 * @type {string[]}
 */
const tagsSetBySystem = ['Bagging-Date', 'Bagging-Software',
                         'Payload-Oxum', 'DPN-Object-ID',
                         'First-Version-Object-ID', 'Bag-Size'];

/**
 * TagDefinition describes the name of a tag, which tag file it should
 * appear in, what its allowed values are, and more.
 *
 * TagDefinitions belong to the BagItProfile object.
 *
 * @see {@link BagItProfile}
 *
 * @param {string} tagFile - The name of the tag file in which this tag should appear.
 * @param {string} tagName - The name of the tag.
 *
 */
class TagDefinition {
    constructor(tagFile, tagName) {
        /**
          * The unique identifier for this TagDefinition.
          * This is a version 4 UUID in hex string format.
          *
          * @type {string}
          */
        this.id = Util.uuid4();
        /**
          * The name of the tag file in which this tag is
          * expected to appear.
          *
          * @type {string}
          */
        this.tagFile = tagFile;
        /**
          * The name of the tag. For example, 'Source-Organization'.
          *
          * @type {string}
          */
        this.tagName = tagName;
        /**
          * True if this tag must be present in the tag file.
          * Some tags may be present but empty.
          *
          * @see {@link emptyOk}
          *
          * @type {boolean}
          * @default false
          */
        this.required = false;
        /**
          * True it's OK for this tag to be empty.
          *
          * @see {@link required}
          *
          * @type {boolean}
          * @default false
          */
        this.emptyOk = false;
        /**
          * A list of valid values for this tag. If this list
          * is empty, then any values are valid. If it is not
          * empty, the BagIt validator will check to ensure that
          * any values assigned to this tag are in the list. If
          * they're not, the validator will reject the bag as invalid.
          *
          * @type {string[]}
          */
        this.values = [];
        /**
          * The default value for this tag. This is the value
          * that will be assigned to the tag when you create a bag
          * and don't specify a value for this tag. For example,
          * if you set the default value of the 'Source-Organization'
          * tag, you'll never have to set that value again when
          * building individual bags (unless you want to). The bagger
          * will simply fill in the default. The userValue property,
          * if non-empty, will override defaultValue during the bagging
          * process.
          *
          * @see {@link userValue}
          *
          * @type {string}
          */
        this.defaultValue = "";
        /**
          * A user-defined value to assign to this tag when creating
          * a bag. If this value is non-empty, it overrides defaultValue.
          * You will always want to set this on a per-bag basis for certain
          * tags, such as 'Title', 'Description', or any other bag-specific
          * tag.
          *
          * @see {@link defaultValue}
          *
          * @type {string}
          */
        this.userValue = "";
        /**
          * Help describes the significance of this tag to end users.
          * In the DART UI, it appears as a tooltip to help the user fill
          * in a meaningful value.
          *
          * @type {string}
          */
        this.help = "";
        /**
          * The isBuiltIn flag is true for built-in tags whose
          * definition should not be altered or even changeable
          * by the user. For example, the BagIt-Version and
          * Tag-File-Character-Encoding tags in the bagit.txt file
          * are builtins whose value the user can edit, and whose
          * definition they cannot alter.
          *
          * @type {boolean}
          */
        this.isBuiltIn = false;
        /**
          * addedForJob is a special flag for tags belonging
          * to custom tag files that were added for a specific
          * job. The UI handles these files differently from those
          * that are part of a core BagItProfile. Custom tag files
          * are added by users.
          *
          * @type {boolean}
          */
        this.addedForJob = false;
    }
    /**
     * This returns a ValidationResult that describes what if anything
     * is not valid about this TagDefinition.
     *
     * @returns {ValidationResult} - The result of the validation check.
     */
    validate() {
        var result = new ValidationResult();
        if (Util.isEmpty(this.tagFile)) {
            result.errors['tagFile'] = "You must specify a tag file.";
        }
        if (Util.isEmpty(this.tagName)) {
            result.errors['tagName'] = "You must specify a tag name.";
        }
        if (this.values.length > 0 && !Util.listContains(this.values, this.defaultValue)) {
            result.errors['defaultValue'] = "The default value must be one of the allowed values.";
        }
        return result
    }
    /**
     * This returns a list of errors describing what's wrong with
     * the tag's value. For example, if a tag value is empty when empty
     * values are not allowed, or if the value is not in the tag's list
     * of valid values.
     *
     * @returns {string[]} - A list of errors.
     */
    validateForJob() {
        var errors = [];
        var value = this.getValue();
        if (this.required && !this.emptyOk && Util.isEmpty(value)) {
            errors.push(`Tag ${this.tagName} in file ${this.tagFile} cannot be empty.`);
        } else if (this.values.length > 0 && !Util.listContains(this.values, value)) {
            errors.push(`Tag ${this.tagName} in file ${this.tagFile} has a value that is not on the list of allowed values.`);
        }
        return errors;
    }
    /**
      * Returns true if the system, and not the user, must set this value.
      * The system sets certain values, such as Bagging-Date, internally
      * when it creates the bag.
      *
      * @see {@link tagsSetBySystem}
      *
      * @returns {string[]}
      */
    systemMustSet() {
        return Util.listContains(tagsSetBySystem, this.tagName);
    }
    /**
      * Returns this tag's userValue, if that's non-empty, or its defaultValue.
      *
      * @returns {string}
      */
    getValue() {
        return this.userValue || this.defaultValue;
    }
    /**
      * Returns true if the tag name contains the word 'description'.
      *
      * @returns {boolean}
      */
    looksLikeDescriptionTag() {
        return this.tagName.toLowerCase().includes("description");
    }
    /**
      * toFormattedString returns the tag as string in a format suitable
      * for writing to a tag file. Following LOC's bagit.py, this function
      * does not break lines into 79 character chunks. It prints the whole
      * tag on a single line, replacing newlines with spaces.
      *
      * @returns {string}
      */
    toFormattedString() {
        var val = (this.getValue() || "").replace(/(\r\n)|\n|\r/g, ' ').replace(/ +/g, ' ').trim();
        return `${this.tagName}: ${val}`;
    }
}

module.exports.TagDefinition = TagDefinition;
