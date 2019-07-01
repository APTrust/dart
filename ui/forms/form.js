const { Context } = require('../../core/context')
const { Field } = require('./field');
const { Util } = require('../../core/util');

/**
 * The Form class converts objects into a structure that can be
 * run through a template and converted into an HTML form.
 *
 */
class Form {
    /**
     * This returns a new form object that DART's templates can render
     * as an HTML form.
     *
     * @param {string} objType - The name of the class this form will
     * represent. For example, AppSetting, RemoteRepository, etc.
     * These are generally subclasses of PersistentObject.
     *
     * @param {PersistentObject|object} obj - The object from which you want
     * to create a form. This class will generate the form fields for all
     * of the attributes of obj, except those specified in the exclude param.
     * The obj param should be an instance of an object derived from
     * {@ref PersistentObject}, but you can create an empty form by passing
     * in an empty object like so:
     *
     * <code>
     * var myForm = new Form('Object', {});
     * </code>.
     *
     * @param {Array<string>} exclude - A list of object attributes to
     * exclude from the form. The form will not include fields for these
     * items. You don't need to include the 'id' or 'userCanDelete'
     * attributes in this list.
     * @default ['errors', 'help', 'required']
     *
     */
    constructor(objType, obj, exclude = ['errors', 'help', 'required']) {
        this.objType = objType;
        this.formId = Util.lcFirst(objType) + 'Form';
        this.obj = obj;
        if (typeof obj.errors === 'undefined') {
            obj.errors = {};
        }
        this.exclude = exclude;
        this.fields = {};
        this.inlineForms = [];
        this.changed = {};
        this._initFields();
    }

    /**
     * This creates fields for each attribute of form.obj, including
     * setting the name, id, value, label, error message and help text
     * of each item.
     *
     * The label and help text come from the locale file for each
     * specific language. To set the label, add an entry to to the
     * locale file named <ClassName>_<property>_label. To set the
     * help text, add an entry to the locale file named
     * <ClassName>_<property>_help. For example:
     *
     * <code>
     * {
     *   "MyClass_surname_label": "Surname",
     *   "MyClass_surname_help": "Enter your family name.",
     * }
     * </code>
     *
     * This does not set the choices for select lists or checkbox groups.
     * You'll have to do that yourself after the form is created.
     *
     * This method does not determine which HTML control will render
     * on the form. Since that is a layout issue, you can specify that
     * in your form template.
     *
     */
    _initFields() {
        for(let [name, value] of Object.entries(this.obj)) {
            if (!this.exclude.includes(name)) {
                this._initField(name, value);
            }
        }
    }

    /**
     * This creates a single field with the given name and value and
     * adds it to the fields property of the form.
     *
     * @param {string} name - The name of the field to add.
     *
     * @value {string|number|boolean} value - The value of the field.
     */
    _initField(name, value) {
        let elementId = `${this.formId}_${name}`;
        let label = this._getLocalizedLabel(name);
        let field = new Field(elementId, name, label, value);
        field.error = this.obj.errors[name];
        this._setFieldHelpText(field);
        this._setRequired(field);
        this.fields[name] = field;
    }

    /**
     * This method returns the localized label for a form field.
     * It extracts the label from the locale file that matches the
     * user's current system settings. The locale file should have
     * an entry like the one below to specify the label.
     *
     * <code>
     * {
     *   "MyClass_surname_label": "Surname",
     * }
     * </code>
     *
     * If there's no matching entry in the locale file, this returns
     * a modified version of the property name with the first letter
     * of each word capitalized. For example, fieldName "phoneNumber"
     * would return "Phone Number" if there is no matching locale entry.
     *
     * @param {string} fieldName - The name of the field. This is the
     * same as the name of the object property that the field will
     * represent.
     *
     * @returns {string}
     * @private
     */
    _getLocalizedLabel(fieldName) {
        let objType = this.obj.constructor.name;
        let labelKey = `${objType}_${fieldName}_label`;
        let labelText = Context.y18n.__(labelKey);
        if (labelText == labelKey) {
            labelText = Util.camelToTitle(fieldName);
        }
        return labelText;
    }

    /**
     * This sets the html attribute "required='true'" on the field
     * if the field is required. (That is, if it's included in the
     * PersistentObject's required attribute.)
     *
     * @param {Field} field
     * @private
     */
    _setRequired(field) {
        if (this.obj.required && Array.isArray(this.obj.required) && this.obj.required.includes(field.name)) {
            field.attrs['required'] = true;
        }
    }

    /**
     * This sets the help tooltip for the field, if it can be found
     * in the locale file. If Form.obj happens to be an AppSetting,
     * it reads the help directly from the AppSetting.help property.
     * Help strings in the locale file look like this:
     *
     * <code>
     * {
     *   "MyClass_surname_help": "Enter your family name.",
     * }
     * </code>
     *
     * @param {Field} field
     * @private
     */
    _setFieldHelpText(field) {
        if (this.obj.constructor.name == 'AppSetting' && this.obj.help) {
            field.help = this.obj.help;
        } else {
            let helpKey = `${this.obj.constructor.name}_${field.name}_help`;
            let helpText = Context.y18n.__(helpKey);
            if (helpText && helpText != helpKey) {
                field.help = helpText;
            }
        }
    }

    /**
     * Returns true if the form contains errors. Check this after
     * calling {@link parseFromDOM} to see if there were any validation
     * errors.
     *
     * @returns {boolean}
     */
    hasErrors() {
        return this.obj.errors && Object.keys(this.obj.errors).length > 0;
    }


    /**
     * This updates all of the values of Form.obj based on what the
     * user entered in the HTML form. Note that because there are no
     * PUT or POST operations in DART, this method reads directly from
     * the HTML form on the current page, casting number and boolean
     * values to the correct types.
     *
     * This also sets the values of the Form.changed object, which
     * shows the old and new values of each property that the user
     * changed.
     *
     * This returns nothing. Check the values of Form.obj and Form.changed
     * after calling this. The controller classes call this method when
     * users submit forms.
     */
    parseFromDOM() {
        // This is required for jest tests.
        if ($ === undefined) {
            var $ = require('jquery');
        }
        this.changed = {};
        // TODO: Parse checkbox groups. See JobUploadForm.copyFormValuesToJob()
        for (let [name, field] of Object.entries(this.fields)) {
            let oldValue = this.obj[name];
            let formValue = $(`#${field.id}`).val();
            if (typeof formValue === "undefined") {
                // Try parsing as checkbox group.
                formValue = $(`input[name='${name}']:checked`).toArray().map(cb => cb.value);
            }
            try {
                if (Array.isArray(formValue)) {
                    formValue = formValue.map(val => val.trim());
                } else {
                    formValue = formValue.trim();
                }
            } catch (ex) {
                console.error(`Error processing form field '${name}': ${ex.toString()}`);
            }
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

    /**
     * This casts a string value from a form to the correct type required
     * by the underlying object, including strings, numbers and booleans.
     *
     * @param {string|number|boolean} oldValue - The original value, read
     * from the property of Form.obj.
     *
     * @param {string} formValue - The value read from the HTML form, which
     * will always be a string.
     *
     * @returns {string|number|boolean} - The formValue cast to a type
     * that matches the type of oldValue.
     */
    castNewValueToType(oldValue, formValue) {
        let toType = typeof oldValue;
        return Util.cast(formValue, toType);
    }

    /**
     * This sets the errors on the form, based on errors flagged in the
     * {@ref PersistentObject} Form.obj.errors.
     */
    setErrors() {
        this.changed = {};
        this._initFields();

        // Some heavily customized forms call a custom _init
        // function after initializing fields.
        if (typeof this._init === 'function') {
            this._init();
        }
    }
}

module.exports.Form = Form;
