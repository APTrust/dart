"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const Utils_1 = require("../../Utils");
function generateFileCombinations(input) {
    if (!input || input === ".") {
        return undefined;
    }
    let ext = path.extname(input);
    let combinations = [input];
    if (input.endsWith("/")) {
        combinations.push(Utils_1.joinFuseBoxPath(input, "index.js"), Utils_1.joinFuseBoxPath(input, "index.jsx"));
    }
    else {
        if (!ext) {
            combinations.push(`${input}.js`, `${input}.jsx`, Utils_1.joinFuseBoxPath(input, "index.js"), Utils_1.joinFuseBoxPath(input, "index.jsx"));
        }
    }
    combinations.push(combinations + ".js");
    return combinations;
}
exports.generateFileCombinations = generateFileCombinations;
