const electron = require('electron');
const Templates = require('../common/templates');

class BaseController {

    constructor(params, navSection) {
        this.params = params;
        this.navSection = navSection;
        this.alertMessage = null;
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
