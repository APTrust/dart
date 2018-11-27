"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SocketServer_1 = require("./SocketServer");
const Utils_1 = require("../Utils");
const HTTPServer_1 = require("./HTTPServer");
const realm_utils_1 = require("realm-utils");
const process = require("process");
const path = require("path");
class Server {
    constructor(fuse) {
        this.fuse = fuse;
    }
    start(opts) {
        opts = opts || {};
        let rootDir = this.fuse.context.output.dir;
        const root = opts.root !== undefined ? (realm_utils_1.utils.isString(opts.root) ? Utils_1.ensureUserPath(opts.root) : false) : rootDir;
        const port = opts.port || 4444;
        const https = opts.https;
        const fallback = root && opts.fallback && path.join(root, opts.fallback);
        if (opts.hmr !== false && this.fuse.context.useCache === true) {
            setTimeout(() => {
                this.fuse.context.log.echo(`HMR is enabled`);
            }, 1000);
        }
        else {
            setTimeout(() => {
                this.fuse.context.log.echo(`HMR is disabled. Caching should be enabled and {hmr} option should be NOT false`);
            }, 1000);
        }
        this.httpServer = new HTTPServer_1.HTTPServer(this.fuse);
        process.nextTick(() => {
            if (opts.httpServer === false) {
                this.socketServer = SocketServer_1.SocketServer.startSocketServer(port, this.fuse);
            }
            else {
                this.socketServer = this.httpServer.launch({ root, port, https, fallback }, opts);
            }
        });
        return this;
    }
}
exports.Server = Server;
