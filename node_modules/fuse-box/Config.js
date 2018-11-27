"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const appRoot = require("app-root-path");
const path = require("path");
const PROJECT_ROOT = process.env.FUSEBOX_DIST_ROOT || path.resolve(__dirname);
const MAIN_FILE = require.main.filename;
if (MAIN_FILE.indexOf("gulp.js") > -1 && !process.env.PROJECT_ROOT) {
    console.warn("FuseBox wasn't able to detect your project root! You are running gulp!");
    console.warn("Please set process.env.PROJECT_ROOT");
}
class Configuration {
    constructor() {
        this.NODE_MODULES_DIR = process.env.PROJECT_NODE_MODULES || path.join(appRoot.path, "node_modules");
        this.FUSEBOX_ROOT = PROJECT_ROOT;
        this.FUSEBOX_MODULES = process.env.FUSEBOX_MODULES || path.join(PROJECT_ROOT, "modules");
        this.TEMP_FOLDER = process.env.FUSEBOX_TEMP_FOLDER || path.join(appRoot.path, ".fusebox");
        this.PROJECT_FOLDER = appRoot.path;
        this.PROJECT_ROOT = process.env.PROJECT_ROOT || path.dirname(MAIN_FILE);
        this.FUSEBOX_VERSION = process.env.FUSEBOX_VERSION || require(path.join(PROJECT_ROOT, "package.json")).version;
    }
}
exports.Configuration = Configuration;
exports.Config = new Configuration();
