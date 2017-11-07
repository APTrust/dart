class Form {
    constructor() {
        this.field = [];
    }
    validate() {
        // Convert the form to the underlying object,
        // validate that, then set the errors here.
    }
}

class Choice {
    constructor(value, label) {
        this.value = value;
        this.label = label;
        this.selected = false;
    }
    static makeList(items, selected) {
        // return a list of choices
    }
}

class Field {
    constructor(id, name, label, value) {
        this.id = id;
        this.name = name;
        this.label = label;
        this.value = value;
        this.choices = [];
        this.attrs = {}
    }
}

module.exports.Form = Form;
module.exports.Field = Field;
module.exports.Choice = Choice;
