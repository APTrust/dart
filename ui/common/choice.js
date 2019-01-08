const { Util } = require('../../core/util');

class Choice {

    constructor(value, label, selected) {
        this.value = value;
        this.label = label;
        this.selected = selected || false;
    }

    static makeList(items, selected, includeEmptyFirstOption) {
        if (!Array.isArray(selected)) {
            var selValue = selected;
            var selected = []
            selected.push(selValue)
        }
        var choices = [];
        if (includeEmptyFirstOption == true) {
            choices.push(new Choice("", ""));
        }
        for (var item of items) {
            var value = item;
            var label = item;
            if (typeof item == "object" && item.hasOwnProperty("id") && item.hasOwnProperty("name")) {
                value = item.id;
                label = item.name;
            }
            choices.push(new Choice(value, label, Util.listContains(selected, value)));
        }
        return choices;
    }
}

module.exports.Choice = Choice;
