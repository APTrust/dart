const { Form } = require('./form');

/**
 * This form allows the user to create a new Tag File as part
 * of a {@link BagItProfile}. This is how users can specify that their
 * {@link BagItProfile} requires a tag file in addition to the standard
 * bagit.txt and bag-info.txt.
 *
 * @param {string} tagFileName - The name of the new tag file.
 */
class TagFileForm extends Form {

    constructor(tagFileName) {
        // On this form, we do include 'required'
        super('TagFile', {});
        this._init(tagFileName);
    }

    /**
     * This method creates the forms' one important field, "tagFileName".
     * It also creates an "id" field, which the base Form class expects
     * to be present. However, the value of the id field is irrelevant in
     * this context.
     *
     * @param {string} tagFileName - The name of the tag file.
     *
     * @private
     */
    _init(tagFileName) {
        this._initField('id', 'throwaway');
        this._initField('tagFileName', tagFileName);
    }

}

module.exports.TagFileForm = TagFileForm;
