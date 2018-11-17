"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const https = require("https");
const express = require("express");
const SocketServer_1 = require("./SocketServer");
const Utils_1 = require("../Utils");
class HTTPServer {
    constructor(fuse) {
        this.fuse = fuse;
        this.app = express();
    }
    static start(opts, fuse) {
        let server = new HTTPServer(fuse);
        server.launch(opts);
        return server;
    }
    launch(opts, userSettings) {
        this.opts = opts || {};
        const port = this.opts.port || 4444;
        let server = this.createServer();
        const socketServer = SocketServer_1.SocketServer.createInstance(server, this.fuse);
        this.setup();
        if (userSettings && userSettings.proxy) {
            let proxyInstance;
            try {
                proxyInstance = require("http-proxy-middleware");
            }
            catch (e) { }
            if (proxyInstance) {
                for (let uPath in userSettings.proxy) {
                    this.app.use(uPath, proxyInstance(userSettings.proxy[uPath]));
                }
            }
            else {
                this.fuse.context.log.echoWarning("You are using development proxy but 'http-proxy-middleware' was not installed");
            }
        }
        if (this.opts.fallback) {
            this.app.use("*", (req, res) => {
                res.sendFile(this.opts.fallback);
            });
        }
        server.on("request", this.app);
        setTimeout(() => {
            const packageInfo = Utils_1.getFuseBoxInfo();
            server.listen(port, () => {
                const msg = `
-----------------------------------------------------------------
Development server running ${opts.https ? "https" : "http"}://localhost:${port} @ ${packageInfo.version}
-----------------------------------------------------------------
`;
                console.log(msg);
            });
        }, 10);
        return socketServer;
    }
    createServer() {
        let server;
        if (this.opts.https) {
            server = https.createServer(this.opts.https);
        }
        else {
            server = http.createServer();
        }
        return server;
    }
    serveStatic(userPath, userFolder) {
        this.app.use(userPath, express.static(Utils_1.ensureUserPath(userFolder)));
    }
    setup() {
        if (this.opts.root) {
            this.app.use("/", express.static(this.opts.root));
            if (!this.fuse.context.inlineSourceMaps && process.env.NODE_ENV !== "production") {
                this.fuse.context.log.echoInfo(`You have chosen not to inline source maps`);
                this.fuse.context.log.echoInfo("You source code is exposed at src/");
                this.fuse.context.log.echoWarning("Make sure you are not using dev server for production!");
                this.app.use(this.fuse.context.sourceMapsRoot, express.static(this.fuse.context.homeDir));
            }
        }
    }
}
exports.HTTPServer = HTTPServer;
