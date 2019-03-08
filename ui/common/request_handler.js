const Controllers = require('../controllers');
const fs = require('fs');
const path = require('path');
const url = require('url');

class RequestHandler {

    constructor(href) {
        this.href = href;
        this.isModalRequest = false;
        this.controllerName = null;
        this.functionName = "";
        this.params = null;
        this.controllerInstance = null;
        this.parseRequest();
    }

    parseRequest() {
        let [_, hashAndQueryString] = this.href.split('#');
        if (!hashAndQueryString) {
            throw `Invalid URL: '${this.href}' is missing hash.`;
        }
        let [hash, queryString] = hashAndQueryString.split('?');
        let params = new url.URLSearchParams(queryString);
        let [controller, fn] = hash.split('/');
        if (!controller || !fn) {
            throw `Invalid URL: '${this.href}' is missing controller or function name.`;
        }
        this.controllerName = controller + 'Controller';
        this.functionName = fn;
        this.params = params;
        this.controllerInstance = new Controllers[this.controllerName](this.params);
    }

    handleRequest() {
        let response = this.controllerInstance[this.functionName]();
        if (response.container) {
            $('#nav').html(response.nav);
            $('#container').html(response.container);
            $('#modal').modal('hide');
        } else if (response.modalContent) {
            $('#modalTitle').html(response.modalTitle);
            $('#modalContent').html(response.modalContent);
            $('#modal').modal('show');
            this.isModalRequest = true;
        }
        if (typeof this.controllerInstance.postRenderCallback === 'function') {
            this.controllerInstance.postRenderCallback(this.functionName);
        }
    }
}

module.exports.RequestHandler = RequestHandler;
