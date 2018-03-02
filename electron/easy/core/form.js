class Form {
    constructor(id) {
        this.id = id;
        this.fields = {};
        this.inlineForms = [];
    }
    objectType() {
        return 'Form';
    }
    setErrors(errors) {
        for (var name of Object.keys(this.fields)) {
            var field = this.fields[name];
            field.error = errors[name];
        }
    }
}

module.exports.Form = Form;
