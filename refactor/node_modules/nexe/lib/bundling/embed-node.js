"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var crypto_1 = require("crypto");
var path = require("path");
var fs = require("fs");
function hashName(name) {
    return crypto_1.createHash('md5')
        .update(name)
        .digest('hex')
        .toString()
        .slice(0, 8);
}
function embedDotNode(options, file) {
    var contents = fs.readFileSync(file.absPath);
    var modulePathParts = file.absPath.split(path.sep).reverse();
    var module = modulePathParts[modulePathParts.findIndex(function (x) { return x === 'node_modules'; }) - 1];
    var bindingName = path.basename(file.absPath);
    var settings = options[module];
    var moduleDir = hashName(contents);
    file.contents = "\n  var fs=require('fs');var path=require('path');var binding='" + contents.toString('base64') + "';function mkdirp(r,t){t=t||null,r=path.resolve(r);try{fs.mkdirSync(r),t=t||r}catch(c){if(\"ENOENT\"===c.code)t=mkdirp(path.dirname(r),t),mkdirp(r,t);else{var i;try{i=fs.statSync(r)}catch(r){throw c}if(!i.isDirectory())throw c}}return t};";
    if (!settings || settings === true) {
        file.contents += ("\n      mkdirp('" + moduleDir + "');\n      var bindingPath = path.join(process.cwd(), '" + moduleDir + "', '" + bindingName + "')\n      \n      require('fs').writeFileSync(bindingPath, Buffer.from(binding, 'base64'))\n      process.dlopen(module, bindingPath)\n    ").trim();
        return {};
    }
    var depth = 0;
    settings.additionalFiles.forEach(function (file) {
        var ownDepth = 0;
        file.split('/').forEach(function (x) { return x === '..' && ownDepth++; });
        depth = ownDepth > depth ? ownDepth : depth;
    });
    var segments = [moduleDir];
    while (depth--) {
        segments.push(hashName(moduleDir + depth));
    }
    segments.push(bindingName);
    file.contents += "\n    var cwd = process.cwd()\n    var bindingFileParts = " + JSON.stringify(segments) + ";\n    var bindingFile = path.join.apply(path, [cwd].concat(bindingFileParts));\n    mkdirp(path.dirname(bindingFile));\n    fs.writeFileSync(bindingFile, Buffer.from(binding, 'base64'));\n    " + settings.additionalFiles.reduce(function (code, filename, i) {
        var contents = fs.readFileSync(path.join(path.dirname(file.absPath), filename));
        return (code += "\n        var file" + i + " = '" + contents.toString('base64') + "';\n        var filePath" + i + " = path.join(cwd, bindingFileParts[0], '" + filename.split('../').join('') + "');\n        mkdirp(path.dirname(filePath" + i + "));\n        fs.writeFileSync(filePath" + i + ", Buffer.from(file" + i + ", 'base64'));\n      ");
    }, '') + ";\n    process.dlopen(module, bindingFile)\n  ";
}
exports.embedDotNode = embedDotNode;
