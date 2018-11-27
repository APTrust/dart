"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var promise_1 = require("./promise");
function noop() {
    return promise_1.PromiseConfig.constructor.resolve();
}
function throwIfHasBeenCalled(fn) {
    if (fn._called) {
        throw new Error('Cannot call next more than once');
    }
    return fn._called = true;
}
function throwIfNotFunction(x) {
    if ('function' !== typeof x) {
        throw new TypeError(x + ", middleware must be a function");
    }
    return x;
}
function tryInvokeMiddleware(context, middleware, next) {
    if (next === void 0) { next = noop; }
    try {
        return middleware
            ? promise_1.PromiseConfig.constructor.resolve(middleware(context, next))
            : promise_1.PromiseConfig.constructor.resolve(context);
    }
    catch (error) {
        return promise_1.PromiseConfig.constructor.reject(error);
    }
}
function middlewareReducer(composed, mw) {
    return function (context, nextFn) {
        if (nextFn === void 0) { nextFn = noop; }
        var next = function () { return throwIfHasBeenCalled(next) && composed(context, nextFn); };
        return tryInvokeMiddleware(context, mw, next);
    };
}
function compose() {
    var middleware = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        middleware[_i] = arguments[_i];
    }
    var mw = [].concat.apply([], middleware);
    return mw.filter(throwIfNotFunction)
        .reduceRight(middlewareReducer, tryInvokeMiddleware);
}
exports.compose = compose;
