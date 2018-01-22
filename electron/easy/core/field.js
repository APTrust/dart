module.exports = class Field {
    constructor(id, name, label, value) {
        this.id = id;
        this.name = name;
        this.label = label;
        this.value = value;
        this.error = "";
        this.choices = [];
        this.cssClasses = [];
        this.attrs = {}
    }
    objectType() {
        return 'Field';
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
