const fs = require('fs');
const path = require('path');
const url = require('url');

class UIHelper {

    constructor() {

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

module.exports.UIHelper = Object.freeze(new UIHelper());
