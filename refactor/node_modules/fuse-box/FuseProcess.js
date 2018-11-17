"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
class FuseProcess {
    constructor(bundle) {
        this.bundle = bundle;
    }
    setFilePath(filePath) {
        this.filePath = filePath;
    }
    kill() {
        if (this.node) {
            this.node.kill();
        }
    }
    start() {
        this.kill();
        this.exec();
        return this;
    }
    require(opts = {}) {
        function getMainExport(mdl) {
            return mdl && mdl.FuseBox && mdl.FuseBox.mainFile ? mdl.FuseBox.import(mdl.FuseBox.mainFile) : mdl;
        }
        return new Promise((resolve, reject) => {
            let cache = require.cache, cached = cache[this.filePath], closePromise, exps;
            if (cached) {
                try {
                    if (opts.close)
                        closePromise = opts.close(cached.exports);
                    else {
                        exps = getMainExport(cached.exports);
                        if (exps) {
                            closePromise = exps.close
                                ? cached.close()
                                : exps.default && exps.default.close
                                    ? exps.default.close()
                                    : console.warn(`Bundle ${this.bundle.name} doesn't export a close() function and no close was given`);
                        }
                    }
                }
                catch (x) {
                    console.error(`Exception while closing bundle ${this.bundle.name}.`);
                    reject(x);
                }
                delete cache[this.filePath];
            }
            if (!(closePromise instanceof Promise)) {
                closePromise = Promise.resolve(true);
            }
            closePromise
                .then(() => {
                var exps = false;
                try {
                    exps = require(this.filePath);
                }
                catch (x) {
                    reject(x);
                }
                if (exps)
                    resolve(exps);
            })
                .catch(reject);
        });
    }
    exec() {
        const node = child_process_1.spawn("node", [this.filePath], {
            stdio: "inherit",
        });
        node.on("close", code => {
            if (code === 8) {
                console.error("Error detected, waiting for changes...");
            }
        });
        this.node = node;
        return this;
    }
}
exports.FuseProcess = FuseProcess;
