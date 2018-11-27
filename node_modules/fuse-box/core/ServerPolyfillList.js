"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SERVER_POLYFILL = new Set([
    "assert",
    "buffer",
    "child_process",
    "crypto",
    "events",
    "fs",
    "http",
    "https",
    "module",
    "net",
    "os",
    "path",
    "process",
    "querystring",
    "stream",
    "timers",
    "tls",
    "tty",
    "url",
    "util",
    "zlib",
]);
const ELECTRON_POLYFILL = new Set([
    "assert",
    "buffer",
    "child_process",
    "crypto",
    "fs",
    "http",
    "https",
    "module",
    "net",
    "os",
    "path",
    "process",
    "querystring",
    "stream",
    "timers",
    "tls",
    "tty",
    "url",
    "util",
    "zlib",
]);
function isServerPolyfill(name) {
    return SERVER_POLYFILL.has(name);
}
exports.isServerPolyfill = isServerPolyfill;
function isElectronPolyfill(name) {
    return ELECTRON_POLYFILL.has(name);
}
exports.isElectronPolyfill = isElectronPolyfill;
