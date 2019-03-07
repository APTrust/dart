const Controllers = require('../controllers');
const fs = require('fs');
const path = require('path');
const url = require('url');

// ---------------------------------------------------------------------
// TODO: Change this class to Handler, with a cleaner, more expressive
// set of function names.
// ---------------------------------------------------------------------
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

    getHandler(href) {
        let req = this.parseLocation(href);
        let controller = new Controllers[req.controller](req.params);
        let handler = {
            controller: controller,
            functionName: req.fn,
            postRenderCallback: null
        }
        if (typeof controller.postRenderCallback === 'function') {
            handler.postRenderCallback = controller.postRenderCallback;
        }
        return handler;
    }

    // TODO: Rewrite the functions below to encapsulate the code and logic
    // application.js hashchange event. Then, in hashchange, we should
    // just have to call:
    //
    // let handler = new RequestHandler(location.href)
    // handler.handleRequest()
    //
    // handleRequest will call handlePostRender internally

    // handleRequest(href) {
    //     let req = this.parseLocation(href);
    //     let controller = new Controllers[req.controller](req.params);
    //     return controller[req.fn]();
    // }

    // handlePostRender(href) {
    //     let req = this.parseLocation(href);
    //     let controller = new Controllers[req.controller](req.params);
    //     if (typeof controller.postRenderCallback === 'function') {
    //         return controller.postRenderCallback(req.fn);
    //     }
    //     return null;
    // }

}

module.exports.UIHelper = Object.freeze(new UIHelper());
