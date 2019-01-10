const electron = require('electron');

class BaseController {

    constructor(params, navSection) {
        this.params = params;
        this.navSection = navSection;
    }

    containerContent(html) {
        return {
            nav: Templates.nav({ section: this.navSection }),
            container: html
        }
    }

    modalContent(title, body) {
        return {
            modalTitle: title,
            modalContent: body
        }
    }

    noContent() {
        return {};
    }

    openExternal() {
        console.log(this.params);
        electron.shell.openExternal(this.params.get('url'));
    }
}

module.exports.BaseController = BaseController;
