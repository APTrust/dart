"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const realm_utils_1 = require("realm-utils");
class BundleRunner {
    constructor(fuse) {
        this.fuse = fuse;
        this.topTasks = [];
        this.bundles = [];
        this.bottomTasks = [];
    }
    top(fn) {
        this.topTasks.push(fn);
    }
    bottom(fn) {
        this.bottomTasks.push(fn);
    }
    bundle(bundle) {
        this.bundles.push(bundle);
    }
    executeTop() {
        return Promise.all(this.topTasks.map(fn => fn()));
    }
    executeBottom() {
        return Promise.all(this.bottomTasks.map(fn => fn()));
    }
    executeBundles(runType) {
        if (runType === "waterfall") {
            return realm_utils_1.each(this.bundles, bundle => bundle.exec());
        }
        return Promise.all(this.bundles.map(bundle => bundle.exec()));
    }
    run(opts = { runType: "waterfall" }) {
        return this.executeTop()
            .then(() => this.executeBundles(opts.runType))
            .then(() => this.executeBottom());
    }
}
exports.BundleRunner = BundleRunner;
