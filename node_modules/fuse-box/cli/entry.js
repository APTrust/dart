#! /usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const argv = require("getopts")(process.argv.slice(2));
const Install_1 = require("./Install");
const Help_1 = require("./Help");
const CMD = {
    install: Install_1.Install,
    help: Help_1.Help,
};
function extractParams(args) {
    if (args.help) {
        return new Help_1.Help(args);
    }
    args._.forEach((name, index) => {
        if (CMD[name]) {
            args._ = args._.splice(index + 1);
            return new CMD[name](args);
        }
    });
}
function initCLI() {
    extractParams(argv);
}
initCLI();
