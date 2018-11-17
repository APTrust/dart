"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
class ExtensionOverrides {
    constructor(overrides) {
        this.overrides = [];
        overrides.forEach(override => this.add(override));
    }
    isValid(override) {
        return typeof override === "string" && override.indexOf(".") === 0;
    }
    add(override) {
        if (this.isValid(override)) {
            this.overrides.push(override);
        }
    }
    setOverrideFileInfo(file) {
        if (this.overrides.length === 0 || !file.belongsToProject()) {
            return;
        }
        const fileInfo = path.parse(file.info.absPath);
        for (let overrideExtension of this.overrides) {
            const overridePath = path.resolve(fileInfo.dir, `${fileInfo.name}${overrideExtension}`);
            if (overrideExtension.indexOf(fileInfo.ext) > -1 && fs.existsSync(overridePath)) {
                file.absPath = file.info.absPath = overridePath;
                file.hasExtensionOverride = true;
                file.context.log.echoInfo(`Extension override found. Mapping ${file.info.fuseBoxPath} to ${path.basename(file.info.absPath)}`);
            }
        }
    }
    getPathOverride(pathStr) {
        if (this.overrides.length === 0) {
            return;
        }
        const fileInfo = path.parse(pathStr);
        for (let overrideExtension of this.overrides) {
            const overridePath = path.resolve(fileInfo.dir, `${fileInfo.name}${overrideExtension}`);
            if (overrideExtension.indexOf(fileInfo.ext) > -1 && fs.existsSync(overridePath)) {
                return overridePath;
            }
        }
    }
}
exports.ExtensionOverrides = ExtensionOverrides;
