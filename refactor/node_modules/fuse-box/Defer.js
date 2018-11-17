"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Defer {
    constructor() {
        this.locked = false;
        this.reset();
    }
    reset() {
        this.queued = new Map();
    }
    queue(id, fn) {
        if (this.locked === false) {
            return fn();
        }
        if (!this.queued.get(id)) {
            this.queued.set(id, fn);
        }
    }
    release() {
        this.queued.forEach((fn, key) => {
            fn();
        });
        this.reset();
    }
    lock() {
        this.locked = true;
    }
    unlock() {
        this.locked = false;
        this.release();
    }
}
exports.Defer = Defer;
