"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class QuantumTask {
    constructor(core) {
        this.core = core;
        this.tasks = new Set();
    }
    add(fn) {
        this.tasks.add(fn);
    }
    async execute() {
        for (const task of this.tasks) {
            await task();
        }
        this.tasks = new Set();
    }
}
exports.QuantumTask = QuantumTask;
