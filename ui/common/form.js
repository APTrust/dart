const { Context } = require('../../core/context')
const { Field } = require('./field');
const { Util } = require('../../core/util');

class Form {

    constructor(formId, obj, exclude = ['errors', 'help', 'type', 'required']) {
        this.formId = formId;
        this.obj = obj;
        this.exclude = exclude;
        this.fields = {};
        this.inlineForms = [];
        this.changed = {};
        this._initFields();
    }

    // This does most of the grunt work, but you'll still have
    // to do some customization afterward.
    _initFields() {
        for(let [name, value] of Object.entries(this.obj)) {
            if (!this.exclude.includes(name)) {
                let elementId = `${this.formId}_${name}`;
                let label = Util.camelToTitle(name);
                let field = new Field(elementId, name, label, value);
                field.error = this.obj.errors[name];
                this._setFieldHelpText(field);
                this._setRequired(field);
                this.fields[name] = field;
            }
        }
    }

    // Set the 'required' html attribute if this field is required.
    _setRequired(field) {
        if (this.obj.required.includes(field.name)) {
            field.attrs['required'] = true;
        }
    }

    // Set the help text for the field, if it exists in the locale file.
    _setFieldHelpText(field) {
        if (this.obj.type == 'AppSetting' && this.obj.help) {
            field.help = this.obj.help;
        } else {
            let helpKey = `${this.obj.type}_${field.name}_help`;
            let helpText = Context.y18n.__(helpKey);
            if (helpText && helpText != helpKey) {
                field.help = helpText;
            }
        }
    }


    // Update the properties of this.obj with the values the user
    // entered in the HTML form.
    parseFromDOM() {
        // This is required for jest tests.
        if ($ === undefined) {
            var $ = require('jquery');
        }
        this.changed = {};
        for (let [name, field] of Object.entries(this.fields)) {
            let oldValue = this.obj[name];
            // console.log(name);
            let formValue = $(`#${field.id}`).val().trim();
            let newValue = this.castNewValueToType(oldValue, formValue);
            if (oldValue !== newValue) {
                this.changed[name] = {
                    old: oldValue,
                    new: newValue
                };
                this.obj[name] = newValue;
            }
        }
    }

    // Cast strings from DOM form to bool or number if necessary.
    castNewValueToType(oldValue, formValue) {
        let toType = typeof oldValue;
        return Util.cast(formValue, toType);
    }

    setErrors() {
        this.changed = {};
        this._initFields();
    }
}

module.exports.Form = Form;
