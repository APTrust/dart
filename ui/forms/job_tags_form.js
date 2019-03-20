const { BagItProfile } = require('../../bagit/bagit_profile');
const { Choice } = require('./choice');
const { Context } = require('../../core/context');
const { Field } = require('./field');
const { Form } = require('./form');
const { PluginManager } = require('../../plugins/plugin_manager');

/**
 * JobTagsForm can present and parse the form that allows
 * the user to fill in tag values for a BagIt bag.
 */
class JobTagsForm extends Form {

    constructor(job) {
        super('JobTags', {});
        this._init(job);
    }

    _init(job) {
        for (let tagDef of job.bagItProfile.tags) {
            let field = this._tagDefToField(tagDef);
            this.fields[field.name] = field;
        }
    }

    /**
     * This converts a {@link TagDefinition} to a Form {@link Field}
     * object. This method is not part of the {@link TagDefinition}
     * object itself because it pertains only to the UI and we don't
     * want to require any UI-specific code in the core classes.
     *
     * @params {TagDefinition} t
     *
     * @returns {Field}
     */
    _tagDefToField(t) {
        var label = `${t.tagFile}: ${t.tagName}`;
        var field = new Field(t.id, t.tagName, label, t.getValue());
        field.help = t.help;
        if (t.values) {
            field.choices = Choice.makeList(t.values, t.getValue(), true);
        }
        if (t.systemMustSet()) {
            field.help = t.help +
                " The system will set this field's value when it creates the bag.";
            field.attrs['disabled'] = true;
        }
        if (t.required && !t.emptyOk) {
            field.attrs['required'] = true;
            field.cssClasses.push('required');
        }

        // Add some extra properties to the Field object
        // that will help render specific types of tags.
        // And we can, because JavaScript == AnythingGoes.
        //
        // Description tags can be rendered as textareas
        // instead of regular text inputs.
        field.looksLikeDescriptionTag = t.looksLikeDescriptionTag();

        // Tags that were added for a single job can legally be
        // deleted by the user without breaking conformity to
        // the BagIt profile.
        field.wasAddedForJob = t.wasAddedForJob;

        // Profit!
        return field;
    }
}

module.exports.JobTagsForm = JobTagsForm;
