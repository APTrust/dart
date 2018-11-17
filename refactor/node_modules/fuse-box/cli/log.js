"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk = require("chalk");
function info(text) {
    console.log(chalk.gray(`  : ${text}`));
}
exports.info = info;
function help(obj) {
    for (const cmd in obj) {
        console.log("   " + chalk.green.bold(cmd));
        console.log(chalk.gray(`    ${obj[cmd]}`));
    }
}
exports.help = help;
function error(text) {
    console.log(chalk.bold.red(`  : ${text}`));
}
exports.error = error;
function title(text) {
    console.log(chalk.bold.green(`    ${text}`));
}
exports.title = title;
function desc(text) {
    console.log(chalk.gray(`     - ${text}`));
}
exports.desc = desc;
