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

    // -----------------------------------------------------------------
    // TODO: Needs type casting. Move casting from Form to Util first.
    // -----------------------------------------------------------------
    // Convert URLSearchParams to hash.
    // paramsToHash(params) {
    //     let data = {};
    //     for(let [key, value] of params.entries()) {
    //         data[key] = value;
    //     }
    //     return data;
    // }
}

module.exports.UIHelper = Object.freeze(new UIHelper());
