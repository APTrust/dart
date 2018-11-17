"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs = require("fs");
const Utils_1 = require("../Utils");
async function tsc(root, opts) {
    let tscOptions = [];
    root = Utils_1.ensureAbsolutePath(root);
    opts.project = root;
    for (const key in opts) {
        if (opts[key] !== undefined) {
            if (key === "watch") {
                tscOptions.push(`--${key}`);
            }
            else {
                tscOptions.push(`--${key}`, String(opts[key]));
            }
        }
    }
    return new Promise((resolve, reject) => {
        const proc = child_process_1.spawn("tsc" + (/^win/.test(process.platform) ? ".cmd" : ""), tscOptions, {
            stdio: "inherit",
        });
        proc.on("close", function (code) {
            if (code === 8) {
                return reject("Error detected");
            }
            return resolve();
        });
    });
}
exports.tsc = tsc;
async function npmPublish(opts) {
    opts.tag = opts.tag || "latest";
    return new Promise((resolve, reject) => {
        const publish = child_process_1.spawn("npm", ["publish", "--tag", opts.tag], {
            stdio: "inherit",
            cwd: Utils_1.ensureAbsolutePath(opts.path),
        });
        publish.on("close", function (code) {
            if (code === 8) {
                return reject("Error detected, waiting for changes...");
            }
            return resolve();
        });
    });
}
exports.npmPublish = npmPublish;
function bumpVersion(packageJSONPath, opts) {
    let filePath, json;
    if (!opts.userJson) {
        filePath = Utils_1.ensureAbsolutePath(packageJSONPath);
        if (!fs.existsSync(filePath)) {
            throw new Error(`${filePath} was not found`);
        }
        json = JSON.parse(fs.readFileSync(filePath).toString());
    }
    else {
        json = opts.userJson;
    }
    let version = json.version || "1.0.0";
    const type = opts.type;
    let matched = version.match(/(\d{1,}).(\d{1,})\.(\d{1,})(-(\w{1,})\.(\d{1,}))?/i);
    let major = matched[1] * 1;
    let minor = matched[2] * 1;
    let patch = matched[3] * 1;
    let addonName = matched[5];
    let addonNumber = matched[6];
    const resetAddon = () => {
        addonName = undefined;
        addonNumber = undefined;
    };
    if (type === "patch") {
        resetAddon();
        patch++;
    }
    else if (type === "minor") {
        minor++;
        patch = 0;
        resetAddon();
    }
    else if (type === "major") {
        patch = 0;
        minor = 0;
        resetAddon();
        major++;
    }
    else {
        if (addonName === type && addonNumber > -1) {
            addonNumber++;
        }
        else {
            addonName = type;
            addonNumber = 1;
        }
    }
    const base = [`${major}.${minor}.${patch}`];
    if (addonName) {
        base.push(`-${addonName}.${addonNumber}`);
    }
    const finalVersion = base.join("");
    json.version = finalVersion;
    if (opts.userJson) {
        return json;
    }
    else {
        fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
    }
    return json;
}
exports.bumpVersion = bumpVersion;
