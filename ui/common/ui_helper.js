const Controllers = require('../controllers');
const fs = require('fs');
const path = require('path');
const url = require('url');

class UIHelper {

    constructor() {

    }

    parseLocation(href) {
        let [_, hashAndQueryString] = href.split('#');
        if (!hashAndQueryString) {
            throw `Invalid URL: '${href}' is missing hash.`;
        }
        let [hash, queryString] = hashAndQueryString.split('?');
        let params = new url.URLSearchParams(queryString);
        let [controller, fn] = hash.split('/');
        if (!controller || !fn) {
            throw `Invalid URL: '${href}' is missing controller or function name.`;
        }
        return {
            controller: controller + 'Controller',
            fn: fn,
            params: params
        }
    }

    handleRequest(href) {
        let req = this.parseLocation(href);
        let controller = new Controllers[req.controller](req.params);
        return controller[req.fn]();
    }

    handlePostRender(href) {
        let req = this.parseLocation(href);
        let controller = new Controllers[req.controller](req.params);
        if (typeof controller.postRenderCallback === 'function') {
            return controller.postRenderCallback(req.fn);
        }
        return null;
    }

}

module.exports.UIHelper = Object.freeze(new UIHelper());
