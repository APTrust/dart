"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var compose_1 = require("./compose");
exports.compose = compose_1.compose;
var promise_1 = require("./promise");
exports.PromiseConfig = promise_1.PromiseConfig;
var AppBuilder = (function () {
    function AppBuilder() {
        this.middleware = [];
    }
    AppBuilder.prototype.build = function () {
        if (!this.middleware.length) {
            throw new Error('Usage error: must have at least one middleware');
        }
        return compose_1.compose(this.middleware);
    };
    AppBuilder.prototype.use = function (mw) {
        if ('function' !== typeof mw) {
            throw new TypeError(mw + ", middleware must be a function");
        }
        this.middleware.push(mw);
        return this;
    };
    return AppBuilder;
}());
exports.AppBuilder = AppBuilder;
function createAppBuilder() {
    return new AppBuilder();
}
exports.default = createAppBuilder;
