"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var colors = require("chalk");
var ora = require("ora");
var frameLength = 120;
var Logger = /** @class */ (function () {
    function Logger(level) {
        this.verbose = level === 'verbose';
        this.silent = level === 'silent';
        if (!this.silent) {
            this.ora = ora({
                text: 'Starting...',
                color: 'blue',
                spinner: 'dots'
            });
            this.ora.stop();
        }
        var noop = function () { };
        this.modify = this.silent ? noop : this._modify.bind(this);
        this.write = this.silent ? noop : this._write.bind(this);
    }
    Logger.prototype.flush = function () {
        !this.silent && this.ora.succeed();
        return new Promise(function (resolve) { return setTimeout(resolve, frameLength); });
    };
    Logger.prototype._write = function (update, color) {
        if (color === void 0) { color = 'green'; }
        this.ora.succeed().text = colors[color](update);
        this.ora.start();
    };
    Logger.prototype._modify = function (update, color) {
        if (color === void 0) { color = this.ora.color; }
        this.ora.text = update;
        this.ora.color = color;
    };
    Logger.prototype.step = function (text, method) {
        var _this = this;
        if (method === void 0) { method = 'succeed'; }
        if (this.silent) {
            return { modify: function () { }, log: function () { }, pause: function () { }, resume: function () { } };
        }
        if (!this.ora.id) {
            this.ora.start().text = text;
            if (method !== 'succeed') {
                this.ora[method]();
            }
        }
        else {
            this.ora[method]().text = text;
            this.ora.start();
        }
        return {
            modify: this.modify,
            log: this.verbose ? this.write : this.modify,
            pause: function () { return _this.ora.stopAndPersist(); },
            resume: function () { return _this.ora.start(); }
        };
    };
    return Logger;
}());
exports.Logger = Logger;
