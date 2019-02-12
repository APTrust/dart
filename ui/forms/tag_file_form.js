const { Constants } = require('../../core/constants');
const { Field } = require('./field');
const { Form } = require('./form');

class TagFileForm extends Form {

    constructor(tagFileName) {
        // On this form, we do include 'required'
        super('tagFileForm', {});
        this._init(tagFileName);
    }

    _init(tagFileName) {
        this._initField('id', 'throwaway');
        this._initField('tagFileName', tagFileName);
    }

}

module.exports.TagFileForm = TagFileForm;
