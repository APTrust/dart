const { Util } = require('../../core/util');

/**
 * A Choice, when added to a {@link Field} becomes an option
 * in an HTML select list or checkbox group.
 *
 * @param {string} value - The value of the choice/option.
 *
 * @param {string} label - The label to be displayed to the user
 * for this choice/option.
 *
 * @param {boolean} selected - A boolean flag to indicate whether
 * this choice/option should be selected when the HTML form control
 * is rendered.
 */
class Choice {

    constructor(value, label, selected) {
        this.value = value;
        this.label = label;
        this.selected = selected || false;
    }

    /**
     * Returns a list of choice objects.
     *
     * @param {Array<string|object>} items - A list of items from
     * which to make Choices. If each item is a string, both the value
     * and label of the Choice will be set to the string. If the items
     * are objects, the label of each Choice will be set to object.name
     * and the value will be set to object.id. (This is because all
     * PersistentObjects in DART include a name and id.)
     *
     * @param {string|Array{string}} selected - The item or items
     * in the Choice list to be pre-selected when the HTML element
     * renders. If this is a string, the first Choice whose value
     * matches will be selected. If this is an array, all Choices whose
     * values match items in the selected list will be selected.
     *
     * @param {boolean} includeEmptyFirstOption - If true, makeList
     * will add an empty first Choice to the beginning of the list it
     * returns. That empty Choice will have label and value set to
     * the empty string ''.
     *
     */
    static makeList(items, selected, includeEmptyFirstOption) {
        if (!Array.isArray(selected)) {
            // Coerce to array
            selected = [selected];
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
