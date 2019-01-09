const { Field } = require('./field');
const { Util } = require('../../core/util');

class Form {

    constructor(id, obj, exclude = ['errors', 'help', 'type']) {
        this.id = id;
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
                let elementId = `${this.id}_${name}`;
                let label = Util.camelToTitle(name);
                let field = new Field(elementId, name, label, value);
                field.error = this.obj.errors[name];
                this.fields[name] = field;
            }
        }
    }

    // Update the properties of this.obj with the values the user
    // entered in the HTML form.
    parseFromDom() {
        for (let [name, field] of Object.entries(this.fields)) {
            let oldValue = this.obj[name];
            let formValue = $(field.id).val().trim();
            let newValue = this.castFormValueToType(oldValue, formValue);
            if (oldValue !== newValue) {
                this.changed[name] = {
                    old: this.obj[name],
                    new: value
                };
                this.obj[name] = newValue;
            }
        }
    }

    // Cast strings from DOM form to bool or number if necessary.
    castNewValueToType(oldValue, formValue) {
        let castValue = formValue
        if (typeof oldValue === 'boolean') {
            castValue = Util.boolValue(formValue);
        } else if (typeof oldValue === 'number') {
            if (formValue.indexOf('.') > -1) {
                castValue = parseFloat(formValue);
            } else {
                castValue = parseInt(formValue);
            }
        }
        return castValue;
    }
}

module.exports.Form = Form;
