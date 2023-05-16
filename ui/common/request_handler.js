const Controllers = require('../controllers');
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
        // This is for debugging, and is especially helpful for jobs.
        // You can use this uuid to run a job from the command line
        // and see console output. Just grab the UUID and run the 
        // following in the VS code terminal (not the system terminal):
        //
        // node --inspect ./main.js --job <uuid>
        //
        // For this to work, make sure your .vscode/settings.json has
        // the following line:
        //
        // "debug.javascript.autoAttachFilter": "onlyWithFlag" 
        if (window && params) {
            window.dartObjectId = params.get("id")
        }
        let [controller, fn] = hash.split('/');
        if (!controller || !fn) {
            throw `Invalid URL: '${this.href}' is missing controller or function name.`;
        }
        this.controllerName = controller + 'Controller';
        this.functionName = fn;
        this.params = params;
        this.controllerInstance = new Controllers[this.controllerName](this.params);
    }

    /**
     * This handles a request when the URL hash changes, constructing the
     * correct controller class and calling the right method.
     *
     * @returns {boolean} - True or false indicating whether the controller
     * is redirecting to a new controller.
     *
     */
    handleRequest() {
        let response = this.controllerInstance[this.functionName]();
        if (this.controllerInstance.redirected) {
            return true;
        }
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
        this.controllerInstance.postRenderCallback(this.functionName);
        return false;
    }
}

module.exports.RequestHandler = RequestHandler;
