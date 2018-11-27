"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
class SharedCustomPackage {
    constructor(name, data) {
        this.name = name;
        this.data = data;
    }
    init(homeDir, main) {
        this.main = main;
        this.homeDir = homeDir;
        this.mainPath = path.join(homeDir, main);
        this.mainDir = path.dirname(this.mainPath);
    }
}
exports.SharedCustomPackage = SharedCustomPackage;
