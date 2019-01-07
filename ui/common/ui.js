const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const url = require('url');

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

    parseLocation(str) {
        // controller, method, params
        if(str.startsWith('#')) {
            str = str.slice(1);
        }
        let url = new URL(str, 'https://dart');
        let [controller, method] = url.pathname.split('/');
        return {
            controller: controller,
            method: method,
            params: url.searchParams
        }
    }
}

module.exports.UI = Object.freeze(new UI());
