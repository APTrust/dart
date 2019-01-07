const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

const TemplateFiles = {
    nav: path.join(__dirname, '..', 'templates', 'partials', 'nav.ejs')
};

class UI {

    constructor() {
        this.templates = {};
        this.compileTemplates();
    }

    compileTemplates() {
        for (const [name, file] of Object.entries(TemplateFiles)) {
            let content = fs.readFileSync(file);
            this.templates[name] = ejs.compile(content.toString());
        }
    }

    renderNav(section) {
        return this.templates.nav({ section: section });
    }
}

module.exports.UI = Object.freeze(new UI());
