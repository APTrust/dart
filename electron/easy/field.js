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
}
