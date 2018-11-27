/// <reference types="node" />
import * as https from "https";
import { FuseBox } from "../";
import { SocketServer } from "./SocketServer";
import { ServerOptions } from "./Server";
export interface HTTPServerOptions {
    /** Defaults to 4444 if not specified */
    port?: number;
    /** Provide https server options to enable https */
    https?: https.ServerOptions;
    /** 404 fallback */
    fallback?: string;
    /**
     * If specfied this is the folder served from express.static
     * It can be an absolute path or relative to `appRootPath`
     **/
    root?: string | boolean;
}
export declare class HTTPServer {
    private fuse;
    static start(opts: any, fuse: FuseBox): HTTPServer;
    app: any;
    opts: HTTPServerOptions;
    constructor(fuse: FuseBox);
    launch(opts: HTTPServerOptions, userSettings?: ServerOptions): SocketServer;
    private createServer;
    serveStatic(userPath: any, userFolder: any): void;
    private setup;
}
