class Form {
    constructor(id) {
        this.id = id;
        this.fields = {};
        this.inlineForms = [];
    }
    setErrors(errors) {
        for (var name of Object.keys(errors)) {
            var field = this.fields[name];
            if (field) {
                field.error = errors[name];
            }
        }
    }
}

module.exports.Form = Form;
