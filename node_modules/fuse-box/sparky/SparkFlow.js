"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const glob = require("glob");
const fs = require("fs-extra");
const chokidar = require("chokidar");
const path = require("path");
const realm_utils_1 = require("realm-utils");
const Utils_1 = require("../Utils");
const SparkyFile_1 = require("./SparkyFile");
const Sparky_1 = require("./Sparky");
const SparkyFilePattern_1 = require("./SparkyFilePattern");
class SparkFlow {
    constructor() {
        this.activities = [];
        this.initialWatch = false;
    }
    glob(globs, opts) {
        this.activities.push(() => this.getFiles(globs, opts));
        return this;
    }
    createFiles(paths) {
        this.files = [];
        paths.forEach(p => {
            const isAbsolute = path.isAbsolute(p);
            const fpath = isAbsolute ? p : path.join(process.cwd(), p);
            this.files.push(new SparkyFile_1.SparkyFile(fpath, isAbsolute ? path.dirname(p) : process.cwd()));
        });
    }
    stopWatching() {
        if (this.watcher) {
            this.watcher.close();
        }
    }
    watch(globs, opts, fn) {
        this.files = [];
        Sparky_1.log.echoStatus(`Watch ${globs}`);
        this.activities.push(() => new Promise((resolve, reject) => {
            var chokidarOptions = {
                cwd: opts ? Utils_1.ensureUserPath(opts.base) : null,
            };
            this.watcher = chokidar
                .watch(globs, chokidarOptions)
                .on("all", (event, fp) => {
                if (event === "addDir" || event === "unlinkDir")
                    return;
                if (this.initialWatch) {
                    this.files = [];
                    Sparky_1.log.echoStatus(`Changed ${fp}`);
                    if (fn) {
                        fn(event, fp);
                    }
                }
                let info = SparkyFilePattern_1.parse(fp, opts);
                this.files.push(new SparkyFile_1.SparkyFile(info.filepath, info.root));
                if (this.initialWatch) {
                    this.exec();
                }
            })
                .on("ready", () => {
                this.initialWatch = true;
                Sparky_1.log.echoStatus(`Resolved ${this.files.length} files`);
                this.activities[0] = undefined;
                resolve();
            });
        }));
        return this;
    }
    completed(fn) {
        this.completedCallback = fn;
        return this;
    }
    getFiles(globs, opts) {
        this.files = [];
        const getFilePromises = [];
        globs.forEach(g => {
            getFilePromises.push(this.getFile(g, opts));
        });
        return Promise.all(getFilePromises).then(results => {
            this.files = [].concat.apply([], results);
            return this.files;
        });
    }
    getFile(globString, opts) {
        let info = SparkyFilePattern_1.parse(globString, opts);
        return new Promise((resolve, reject) => {
            if (!info.isGlob) {
                return resolve([new SparkyFile_1.SparkyFile(info.filepath, info.root)]);
            }
            glob(info.glob, (err, files) => {
                if (err) {
                    return reject(err);
                }
                return resolve(files.map(file => new SparkyFile_1.SparkyFile(file, info.root)));
            });
        });
    }
    clean(dest) {
        this.activities.push(() => new Promise((resolve, reject) => {
            fs.remove(Utils_1.ensureDir(dest), err => {
                if (err)
                    return reject(err);
                return resolve();
            });
        }));
        return this;
    }
    plugin(plugin) {
        this.activities.push(() => {
        });
        return this;
    }
    each(fn) {
        this.activities.push(() => {
            return realm_utils_1.each(this.files, (file) => {
                return fn(file);
            });
        });
        return this;
    }
    file(mask, fn) {
        this.activities.push(() => {
            let regexp = Utils_1.string2RegExp(mask);
            return realm_utils_1.each(this.files, (file) => {
                if (regexp.test(file.filepath)) {
                    Sparky_1.log.echoStatus(`Captured file ${file.homePath}`);
                    return fn(file);
                }
            });
        });
        return this;
    }
    next(fn) {
        this.activities.push(() => {
            return realm_utils_1.each(this.files, (file) => {
                return fn(file);
            });
        });
        return this;
    }
    dest(dest) {
        Sparky_1.log.echoStatus(`Copy to ${dest}`);
        this.activities.push(() => Promise.all(this.files.map(file => file.copy(dest))));
        return this;
    }
    exec() {
        return realm_utils_1.each(this.activities, (activity) => activity && activity()).then(() => {
            if (this.completedCallback) {
                this.completedCallback(this.files);
            }
            this.files = [];
        });
    }
}
exports.SparkFlow = SparkFlow;
