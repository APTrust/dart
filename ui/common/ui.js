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
        let [_, controller, fn] = url.pathname.split('/');
        if (!controller || !fn) {
            throw `Invalid URL: '${str}' is missing controller or function name.`;
        }
        return {
            controller: controller,
            fn: fn,
            params: url.searchParams
        }
    }
}

module.exports.UI = Object.freeze(new UI());
