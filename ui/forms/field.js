class Field {
    constructor(id, name, label, value) {
        this.id = id;
        this.name = name;
        this.label = label;
        this.value = value;
        this.error = "";
        this.choices = [];
        this.cssClasses = [];
        this.attrs = {}

        // validator is a validation function that should return
        // true if the value is valid and false if not. It should
        // set a meaningful error message if the value is invalid.
        // This is implemented only for setup questions.
        this.validator = null;
    }
    getSelected() {
        var selected = [];
        for (var choice of this.choices) {
            if (choice.selected) {
                selected.push(choice.value);
            }
        }
        if (selected.length == 0) {
            return null;
        } else if (selected.length == 1) {
            return selected[0];
        }
        return selected;
    }
}

module.exports.Field = Field;
