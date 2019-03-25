const { Context } = require('../core/context');
const { Util } = require('../core/util');

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
 * @param {object} opts - Values to copy into TagDefinition properties.
 * The properties of this object match the properties of the TagDefinition
 * class, which are described below.
 *
 */
class TagDefinition {
    constructor(opts = {}) {
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
        this.tagFile = opts.tagFile;
        /**
          * The name of the tag. For example, 'Source-Organization'.
          *
          * @type {string}
          */
        this.tagName = opts.tagName;
        /**
          * True if this tag must be present in the tag file.
          * Some tags may be present but empty.
          *
          * @see {@link emptyOk}
          *
          * @type {boolean}
          * @default false
          */
        this.required = opts.required === true ? true : false;
        /**
          * True it's OK for this tag to be empty.
          *
          * @see {@link required}
          *
          * @type {boolean}
          * @default false
          */
        this.emptyOk = opts.emptyOk === true ? true : false;
        /**
          * A list of valid values for this tag. If this list
          * is empty, then any values are valid. If it is not
          * empty, the BagIt validator will check to ensure that
          * any values assigned to this tag are in the list. If
          * they're not, the validator will reject the bag as invalid.
          *
          * @type {string[]}
          */
        this.values = opts.values || [];
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
        this.defaultValue = opts.defaultValue || "";
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
        this.userValue = opts.userValue || "";
        /**
          * Help describes the significance of this tag to end users.
          * In the DART UI, it appears as a tooltip to help the user fill
          * in a meaningful value.
          *
          * @type {string}
          */
        this.help = opts.help || "";
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
        this.isBuiltIn = opts.isBuiltIn === true ? true : false;
        /**
          * isUserAddedFile is a special flag indicating the user
          * added this custom tag file, which is not part of the
          * standard BagIt profile. The DART UI handles these files
          * differently from those that are part of a core BagItProfile.
          *
          * @type {boolean}
          */
        this.isUserAddedFile = opts.isUserAddedFile === true ? true : false;
        /**
          * isUserAddedTag describes whether this tag was added by
          * the user (and hence is not part of the standard BagIt profile
          * upon which the bag is built). Users may add custom tags to
          * standard tag files (such as bag-info.txt) or to their own
          * custom tag files. All tags in custom tag files will have
          * isUserAddedTag = true.
          *
          * @type {boolean}
          */
        this.isUserAddedTag = opts.isUserAddedTag === true ? true : false;
        /**
         * wasAddedForJob will be true if the user added this custom tag
         * from the jobs UI. This means it's a job-specific tag and the
         * user should be able to delete it without breaking the bag's
         * conformity to a profile.
         */
        this.wasAddedForJob = opts.wasAddedForJob === true ? true : false;
        /**
         * Contains information describing validation errors. Key is the
         * name of the invalid field. Value is a description of why the
         * field is not valid.
         *
         * @type {Object<string, string>}
         */
        this.errors = opts.errors || {};
    }

    /**
     * validate returns true or false, indicating whether this object
     * contains complete and valid data. If it returns false, check
     * the errors property for specific errors.
     *
     * @returns {boolean}
     */
    validate() {
        this.errors = {};
        if (Util.isEmpty(this.tagFile)) {
            this.errors['tagFile'] = "You must specify a tag file.";
        }
        if (Util.isEmpty(this.tagName)) {
            this.errors['tagName'] = "You must specify a tag name.";
        }
        if (!Util.isEmptyStringArray(this.values)) {
            if (!Util.isEmpty(this.defaultValue) && !Util.listContains(this.values, this.defaultValue)) {
            this.errors['defaultValue'] = "The default value must be one of the allowed values.";
            }
            if (!Util.isEmpty(this.userValue) && !Util.listContains(this.values, this.userValue)) {
                this.errors['userValue'] = "The value must be one of the allowed values.";
            }
        }
        return Object.keys(this.errors).length === 0;
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
        //var errors = [];
        this.errors = {}
        var value = this.getValue();
        if (this.required && !this.emptyOk && Util.isEmpty(value)) {
            this.errors['userValue'] = Context.y18n.__("This tag requires a value.");
        } else if (this.values.length > 0 && !Util.listContains(this.values, value)) {
            this.errors['userValue'] = Context.y18n.__("The value is not in the list of allowed values.");
        }
        //return errors;
        return Object.keys(this.errors).length === 0;
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

    /**
      * Given a tag string in command-line format, this returns a new
      * TagDefinition object.
      *
      * @param {string} str - A tag definition string in command-line format,
      * which is filename/tagname: value. For example, call with param
      * 'bag-info/Source-Organization: Faber College' would return a new
      * TagDefinition object with the properties tagFile = 'bag-info.txt',
      * tagName = 'Souce-Organization', userValue = 'Faber College'.
      *
      * @returns {TagDefinition}
      */
    static fromCommandLineArg(str) {
        var tag;
        try {
            var i = str.indexOf(':');
            var [fileAndTag, value] = [str.slice(0,i), str.slice(i+1)];
            var [file, tagName] = fileAndTag.split('/');
            if (!file.endsWith('.txt')) {
                file += '.txt';
            }
            var tag = new TagDefinition({
                tagFile: file.trim(),
                tagName: tagName.trim()
            });
            tag.userValue = value.trim();
            return tag;
        } catch (ex) {
            throw `Invalid format for command-line tag string. '${str}' -> sould be in format 'filename/tagname: value'`
        }
    }
}

module.exports.TagDefinition = TagDefinition;
