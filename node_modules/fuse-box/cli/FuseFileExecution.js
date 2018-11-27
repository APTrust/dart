"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class FuseFileExecution {
    constructor(args) {
        this.args = args;
    }
    static test() {
        console.log(process.cwd());
    }
    install() {
        console.log(this.args);
        console.log("install");
    }
    static init(args) {
        console.log("init", args);
        return new FuseFileExecution(args);
    }
}
exports.FuseFileExecution = FuseFileExecution;
