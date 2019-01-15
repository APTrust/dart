const electron = require('electron');
const Templates = require('../common/templates');
const { Util } = require('../../core/util');

class BaseController {

    constructor(params, navSection) {
        this.params = params;
        this.typeMap = {};
        this.navSection = navSection;
        this.alertMessage = null;
    }

    paramsToHash() {
        let data = {};
        for(let [key, value] of this.params.entries()) {
            let toType = this.typeMap[key];
            if (toType === 'string') {
                data[key] = value;
            } else {
                data[key] = Util.cast(value, toType);
            }
        }
        return data;
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
