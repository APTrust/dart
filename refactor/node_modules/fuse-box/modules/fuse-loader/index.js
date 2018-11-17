"use strict";
/// <reference path="./LoaderAPI.ts"/>
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Exports the global FuseBox loader api as a module
 */
exports.Loader = typeof FuseBox !== "undefined" ? FuseBox : undefined;
