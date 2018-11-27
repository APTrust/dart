"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
function main(compiler, next) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, compiler.setFileContentsAsync('lib/_third_party_main.js', "\"use strict\";\nvar fs = require('fs');\nvar fd = fs.openSync(process.execPath, 'r');\nvar stat = fs.statSync(process.execPath);\nvar footer = Buffer.from(Array(32));\nfs.readSync(fd, footer, 0, 32, stat.size - 32);\nif (!footer.slice(0, 16).equals(Buffer.from('<nexe~~sentinel>'))) {\n    throw 'Invalid Nexe binary';\n}\nvar contentSize = footer.readDoubleLE(16);\nvar resourceSize = footer.readDoubleLE(24);\nvar contentStart = stat.size - 32 - resourceSize - contentSize;\nvar resourceStart = contentStart + contentSize;\nObject.defineProperty(process, '__nexe', (function () {\n    var nexeHeader = null;\n    return {\n        get: function () {\n            return nexeHeader;\n        },\n        set: function (value) {\n            if (nexeHeader) {\n                throw new Error('__nexe cannot be reconfigured');\n            }\n            nexeHeader = Object.assign({}, value, {\n                layout: {\n                    stat: stat,\n                    contentSize: contentSize,\n                    contentStart: contentStart,\n                    resourceSize: resourceSize,\n                    resourceStart: resourceStart\n                }\n            });\n            Object.freeze(nexeHeader);\n        },\n        enumerable: false,\n        configurable: false\n    };\n})());\nvar contentBuffer = Buffer.from(Array(contentSize));\nfs.readSync(fd, contentBuffer, 0, contentSize, contentStart);\nfs.closeSync(fd);\nvar Module = require('module');\nprocess.mainModule = new Module(process.execPath, null);\nprocess.mainModule.loaded = true;\nprocess.mainModule._compile(contentBuffer.toString(), process.execPath);\n")];
                case 1:
                    _a.sent();
                    return [2 /*return*/, next()];
            }
        });
    });
}
exports.default = main;
