/// <reference types="node" />
import { SocketServer } from "./SocketServer";
import { HTTPServer } from "./HTTPServer";
import { FuseBox } from "../core/FuseBox";
import * as https from "https";
export declare type HotReloadEmitter = (server: Server, sourceChangedInfo: any) => any;
export declare type SourceChangedEvent = {
    type: "js" | "css" | "css-file" | "hosted-css";
    content?: string;
    path: string;
    dependants?: any;
};
export interface ServerOptions {
    /** Defaults to 4444 if not specified */
    port?: number;
    /** If not specified it uses regular http */
    https?: https.ServerOptions;
    /** 404 fallback */
    fallback?: string;
    /**
     * - If false nothing is served.
     * - If string specified this is the folder served from express.static
     *      It can be an absolute path or relative to `appRootPath`
     **/
    root?: boolean | string;
    emitter?: HotReloadEmitter;
    httpServer?: boolean;
    socketURI?: string;
    hmr?: boolean;
    open?: boolean | string;
    proxy?: {
        [key: string]: {
            target: string;
            changeOrigin?: boolean;
            pathRewrite: {
                [key: string]: string;
            };
            router: {
                [key: string]: string;
            };
        };
    };
}
/**
 * Wrapper around the static + socket servers
 */
export declare class Server {
    private fuse;
    httpServer: HTTPServer;
    socketServer: SocketServer;
    constructor(fuse: FuseBox);
    /**
     * Starts the server
     * @param str the default bundle arithmetic string
     */
    start(opts?: ServerOptions): Server;
}
