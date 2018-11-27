"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class QuantumSplitConfig {
    constructor(context) {
        this.context = context;
        this.namedItems = new Map();
    }
    getBrowserPath() {
        if (this.resolveOptions && this.resolveOptions.browser) {
            return this.resolveOptions.browser;
        }
        return "";
    }
    getServerPath() {
        if (this.resolveOptions && this.resolveOptions.server) {
            return this.resolveOptions.server;
        }
        return "./";
    }
    getDest() {
        if (this.resolveOptions && this.resolveOptions.dest) {
            return this.resolveOptions.dest;
        }
        return "./";
    }
    register(name, entry) {
        this.namedItems.set(name, entry);
    }
    byName(name) {
        return this.namedItems.get(name);
    }
}
exports.QuantumSplitConfig = QuantumSplitConfig;
