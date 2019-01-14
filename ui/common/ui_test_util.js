const $ = require('jquery');
const fs = require('fs');
const path = require('path');

const indexHTML = fs.readFileSync(path.join(__dirname, '..', 'index.html'));

class UITestUtil {

    constructor() {

    }

    // Check that the expected nav section heading is set to active.
    // Sections include Dashboard, Settings, Jobs, Help.
    assertActiveNavItem(expected) {
        let cssClass = $(`a:contains(${expected})`).parent().attr('class');
        expect(cssClass).toContain("active");
    }

    // Set the document body from the controller response.
    setDocumentBody(response) {
        document.body.innerHTML = indexHTML;
        for (let [identifier, html] of Object.entries(response)) {
            if (html) {
                $('#' + identifier).html(html);
            }
        }
    }

}

// This is a singleton.
module.exports.UITestUtil = Object.freeze(new UITestUtil());
