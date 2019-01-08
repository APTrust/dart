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
}

module.exports.BaseController = BaseController;
