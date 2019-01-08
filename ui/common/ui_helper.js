const Controllers = require('../controllers');
const fs = require('fs');
const path = require('path');
const url = require('url');

class UIHelper {

    constructor() {

    }

    parseLocation(href) {
        if(href.startsWith('#')) {
            href = href.slice(1);
        }
        let requestUrl = new url.URL(href, 'https://example.com/');
        let [_, controller, fn] = requestUrl.pathname.split('/');
        if (!controller || !fn) {
            throw `Invalid URL: '${href}' is missing controller or function name.`;
        }
        return {
            controller: controller + 'Controller',
            fn: fn,
            params: requestUrl.searchParams
        }
    }

    routeRequest(href) {
        let req = this.parseLocation(href);
        let controller = new Controllers[req.controller](req.params);
        controller[req.fn]();
    }

}

module.exports.UIHelper = Object.freeze(new UIHelper());
