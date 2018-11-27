/**
 * This whole file is wrapped in a function by our gulpfile.js
 * The function is injected the global `this` as `__root__`
 **/
declare let __root__: any;
declare let __fbx__dnm__: any;
declare const WorkerGlobalScope: any;
declare const ServiceWorkerGlobalScope: any;
declare const $isServiceWorker: boolean;
declare const $isWebWorker: boolean;
declare const $isBrowser: boolean;
declare const g: {};
/**
 * Package name to version
 */
declare type PackageVersions = {
    [pkg: string]: string;
};
/**
 * Holds the details for a loaded package
 */
declare type PackageDetails = {
    /** Holds the package scope */
    s: {
        entry?: string;
        file?: any;
    };
    /** Holds package files */
    f: {
        [name: string]: {
            fn: Function;
            /** Locals if any */
            locals?: any;
        };
    };
    v: PackageVersions;
};
/**
 * A runtime storage for FuseBox
 */
declare type FSBX = {
    p?: {
        [packageName: string]: PackageDetails;
    };
    /** FuseBox events */
    e?: {
        "after-import"?: any;
    };
};
/**
 * A runtime storage for FuseBox
 */
declare const $fsbx: FSBX;
/**
 * All packages are here
 *  Used to reference to the outside world
 */
declare const $packages: {
    [packageName: string]: PackageDetails;
};
declare const $events: {
    "after-import"?: any;
};
/**
 * Reference interface
 * Contain information about user import;
 * Having FuseBox.import("./foo/bar") makes analysis on the string
 * Detects if it's package or not, explicit references are given as well
 */
interface IReference {
    file?: any;
    /**
     * serverReference is a result of nodejs require statement
     * In case if module is not in a bundle
     */
    server?: string;
    /** Current package name */
    pkgName?: string;
    /** Custom version to take into a consideration */
    versions?: any;
    /** User path */
    filePath?: string;
    /**
     * Converted valid path (with extension)
     * That can be recognized by FuseBox
     */
    validPath?: string;
    /** Require with wildcards (e.g import("/lib/*")) */
    wildcard?: string;
}
/**
 * $getNodeModuleName
 * Considers a partial request
 * for Example
 * require("lodash/dist/hello")
 */
declare function $getNodeModuleName(name: string): string[];
/** Gets file directory */
declare function $getDir(filePath: string): string;
/**
 * Joins paths
 * Works like nodejs path.join
 */
declare function $pathJoin(...string: string[]): string;
/**
 * Adds javascript extension if no extension was spotted
 */
declare function $ensureExtension(name: string): string;
/**
 * Loads a url
 *  inserts a script tag or a css link based on url extension
 */
declare function $loadURL(url: string): void;
/**
 * Loop through an objects own keys and call a function with the key and value
 */
declare function $loopObjKey(obj: Object, func: Function): void;
declare function $serverRequire(path: any): {
    server: any;
};
declare type RefOpts = {
    path?: string;
    pkg?: string;
    v?: PackageVersions;
};
declare function $getRef(name: string, o: RefOpts): IReference;
/**
 * $async
 * Async request
 * Makes it possible to request files asynchronously
 */
declare function $async(file: string, cb: (imported?: any) => any, o?: any): any;
/**
 * Trigger events
 * If a registered callback returns "false"
 * We break the loop
 */
declare function $trigger(name: string, args: any): boolean;
declare function syntheticDefaultExportPolyfill(input: any): void;
/**
 * Imports File
 * With opt provided it's possible to set:
 *   1) Base directory
 *   2) Target package name
 */
declare function $import(name: string, o?: any): any;
declare type SourceChangedEvent = {
    type: "js" | "css";
    content: string;
    path: string;
};
interface LoaderPlugin {
    /**
     * If true is returned by the plugin
     *  it means that module change has been handled
     *  by plugin and no special work is needed by FuseBox
     **/
    hmrUpdate?(evt: SourceChangedEvent): boolean;
}
/**
 * The FuseBox client side loader API
 */
declare class FuseBox {
    static packages: {
        [packageName: string]: PackageDetails;
    };
    static mainFile: string;
    static isBrowser: boolean;
    static isServer: boolean;
    static global(key: string, obj?: any): any;
    /**
     * Imports a module
     */
    static import(name: string, o?: any): any;
    /**
     * @param  {string} n name
     * @param  {any}    fn   [description]
     * @return void
     */
    static on(n: string, fn: any): void;
    /**
     * Check if a file exists in path
     */
    static exists(path: string): boolean;
    /**
     * Removes a module
     */
    static remove(path: string): void;
    static main(name: string): any;
    static expose(obj: any): void;
    /**
     * Registers a dynamic path
     *
     * @param str a function that is invoked with
     *  - `true, exports,require,module,__filename,__dirname,__root__`
     */
    static dynamic(path: string, str: string, opts?: {
        /** The name of the package */
        pkg: string;
    }): void;
    /**
     * Flushes the cache for the default package
     * @param shouldFlush you get to chose if a particular file should be flushed from cache
     */
    static flush(shouldFlush?: (fileName: string) => boolean): void;
    /**
     *
     * Register a package
     */
    static pkg(name: string, v: PackageVersions, fn: Function): any;
    static target: string;
    /**
     * Loader plugins
     */
    static plugins: LoaderPlugin[];
    /** Adds a Loader plugin */
    static addPlugin(plugin: LoaderPlugin): void;
}
/**
 * Injected into the global namespace by the fsbx-default-css-plugin
 * Generates a tag with an `id` based on `__filename`
 * If you call it it again with the same file name the same tag is patched
 * @param __filename the name of the source file
 * @param contents if provided creates a style tag
 *  otherwise __filename is added as a link tag
 **/
declare var __fsbx_css: {
    (__filename: string, contents?: string): void;
};
