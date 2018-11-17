"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const realm_utils_1 = require("realm-utils");
const Utils_1 = require("../Utils");
class SparkyContextClass {
    constructor(target) {
        this.target = target;
    }
}
exports.SparkyContextClass = SparkyContextClass;
function getSparkyContext() {
    if (!exports.SparkyCurrentContext) {
        exports.SparkyCurrentContext = {};
    }
    return exports.SparkyCurrentContext;
}
exports.getSparkyContext = getSparkyContext;
function SparkyContext(target) {
    if (realm_utils_1.utils.isPlainObject(target)) {
        exports.SparkyCurrentContext = target;
    }
    else if (Utils_1.isClass(target)) {
        const Class = target;
        exports.SparkyCurrentContext = new Class();
    }
    else if (realm_utils_1.utils.isFunction(target)) {
        exports.SparkyCurrentContext = target();
    }
    return new SparkyContextClass(exports.SparkyCurrentContext);
}
exports.SparkyContext = SparkyContext;
