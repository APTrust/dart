"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var platforms = ['windows', 'mac', 'alpine', 'linux'], architectures = ['x86', 'x64'];
exports.platforms = platforms;
exports.architectures = architectures;
//TODO bsd
var prettyPlatform = {
    win32: 'windows',
    windows: 'windows',
    win: 'windows',
    darwin: 'mac',
    macos: 'mac',
    mac: 'mac',
    linux: 'linux',
    static: 'alpine',
    alpine: 'alpine'
};
//TODO arm
var prettyArch = {
    x86: 'x86',
    amd64: 'x64',
    ia32: 'x86',
    x32: 'x86',
    x64: 'x64'
};
function isVersion(x) {
    if (!x) {
        return false;
    }
    return /^[\d]+$/.test(x.replace(/v|\.|\s+/g, ''));
}
function isPlatform(x) {
    return x in prettyPlatform;
}
function isArch(x) {
    return x in prettyArch;
}
var Target = /** @class */ (function () {
    function Target(arch, platform, version) {
        this.arch = arch;
        this.platform = platform;
        this.version = version;
    }
    Target.prototype.toJSON = function () {
        return this.toString();
    };
    Target.prototype.toString = function () {
        return this.platform + "-" + this.arch + "-" + this.version;
    };
    return Target;
}());
function targetsEqual(a, b) {
    return a.arch === b.arch && a.platform === b.platform && a.version === b.version;
}
exports.targetsEqual = targetsEqual;
function getTarget(target) {
    if (target === void 0) { target = ''; }
    var currentArch = process.arch;
    var arch = currentArch in prettyArch ? prettyArch[process.arch] : process.arch, platform = prettyPlatform[process.platform], version = process.version.slice(1);
    if (typeof target !== 'string') {
        target = target.platform + "-" + target.arch + "-" + target.version;
    }
    target
        .toLowerCase()
        .split('-')
        .forEach(function (x) {
        if (isVersion(x)) {
            version = x.replace(/v/g, '');
        }
        if (isPlatform(x)) {
            platform = prettyPlatform[x];
        }
        if (isArch(x)) {
            arch = prettyArch[x];
        }
    });
    return new Target(arch, platform, version);
}
exports.getTarget = getTarget;
