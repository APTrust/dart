"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var parseArgv = require("minimist");
var util_1 = require("./util");
var path_1 = require("path");
var target_1 = require("./target");
var os_1 = require("os");
var c = require("chalk");
var caw = require('caw');
exports.version = "2.0.0-rc.34";
var defaults = {
    flags: [],
    cwd: process.cwd(),
    configure: [],
    make: [],
    targets: [],
    vcBuild: util_1.isWindows ? ['nosign', 'release'] : [],
    enableNodeCli: false,
    compress: false,
    build: false,
    bundle: true,
    patches: [],
    plugins: []
};
var alias = {
    i: 'input',
    o: 'output',
    v: 'version',
    t: 'target',
    b: 'build',
    n: 'name',
    r: 'resource',
    a: 'resource',
    p: 'python',
    f: 'flag',
    c: 'configure',
    m: 'make',
    h: 'help',
    l: 'loglevel',
    'fake-argv': 'fakeArgv',
    'gh-token': 'ghToken'
};
var argv = parseArgv(process.argv, { alias: alias, default: __assign({}, defaults) });
exports.argv = argv;
var g = c.gray;
var help = ("\n" + c.bold('nexe <entry-file> [options]') + "\n\n   " + c.underline.bold('Options:') + "\n\n  -i   --input                      -- application entry point\n  -o   --output                     -- path to output file\n  -t   --target                     -- node version description\n  -n   --name                       -- main app module name\n  -r   --resource                   -- *embed files (glob) within the binary\n       --plugin                     -- extend nexe runtime behavior\n\n   " + c.underline.bold('Building from source:') + "\n\n  -b   --build                      -- build from source\n  -p   --python                     -- python2 (as python) executable path\n  -f   --flag                       -- *v8 flags to include during compilation\n  -c   --configure                  -- *arguments to the configure step\n  -m   --make                       -- *arguments to the make/build step\n       --snapshot                   -- path to a warmup snapshot\n       --ico                        -- file name for alternate icon file (windows)\n       --rc-*                       -- populate rc file options (windows)\n       --sourceUrl                  -- pass an alternate source (node.tar.gz) url\n       --enableNodeCli              -- enable node cli enforcement (blocks app cli)\n\n   " + c.underline.bold('Other options:') + "\n\n       --bundle                     -- custom bundling module with 'createBundle' export\n       --temp                       -- temp file storage default '~/.nexe'\n       --cwd                        -- set the current working directory for the command\n       --fake-argv                  -- fake argv[1] with entry file\n       --clean                      -- force download of sources\n       --silent                     -- disable logging\n       --verbose                    -- set logging to verbose\n\n       -* variable key name         * option can be used more than once").trim();
exports.help = help;
exports.help = help = os_1.EOL + help + os_1.EOL;
function flatten() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return (_a = []).concat.apply(_a, args).filter(function (x) { return x; });
    var _a;
}
/**
 * Extract keys such as { "rc-CompanyName": "Node.js" } to
 * { CompanyName: "Node.js" }
 * @param {*} match
 * @param {*} options
 */
function extractCliMap(match, options) {
    return Object.keys(options)
        .filter(function (x) { return match.test(x); })
        .reduce(function (map, option) {
        var key = option.split('-')[1];
        map[key] = options[option];
        delete options[option];
        return map;
    }, {});
}
function tryResolveMainFileName(cwd) {
    var filename;
    try {
        var file = require.resolve(cwd);
        filename = path_1.basename(file).replace(path_1.extname(file), '');
    }
    catch (_) { }
    return filename ? filename : 'nexe_' + Date.now();
}
function extractLogLevel(options) {
    if (options.loglevel)
        return options.loglevel;
    if (options.silent)
        return 'silent';
    if (options.verbose)
        return 'verbose';
    return 'info';
}
function isName(name) {
    return name && name !== 'index';
}
function extractName(options) {
    var name = options.name;
    if (!isName(name) && typeof options.input === 'string') {
        name = path_1.basename(options.input).replace(path_1.extname(options.input), '');
    }
    if (!isName(name)) {
        name = tryResolveMainFileName(options.cwd);
    }
    if (!isName(name) && path_1.basename(options.cwd)) {
        name = path_1.basename(options.cwd);
    }
    return name.replace(/\.exe$/, '');
}
function isEntryFile(filename) {
    return Boolean(filename && !path_1.isAbsolute(filename) && filename !== 'node' && /\.(tsx?|jsx?)$/.test(filename));
}
function resolveEntry(input, cwd, maybeEntry) {
    if (input === '-' || maybeEntry === '-') {
        return '';
    }
    if (input) {
        return path_1.resolve(cwd, input);
    }
    if (isEntryFile(maybeEntry)) {
        return path_1.resolve(cwd, maybeEntry);
    }
    if (!process.stdin.isTTY) {
        return '';
    }
    try {
        return require.resolve(cwd);
    }
    catch (e) {
        throw new Error('No entry file found');
    }
}
exports.resolveEntry = resolveEntry;
function isCli(options) {
    return argv === options;
}
function normalizeOptions(input) {
    var options = Object.assign({}, defaults, input);
    var opts = options;
    var cwd = (options.cwd = path_1.resolve(options.cwd));
    options.temp = options.temp
        ? path_1.resolve(cwd, options.temp)
        : process.env.NEXE_TEMP || path_1.join(os_1.homedir(), '.nexe');
    var maybeEntry = isCli(input) ? argv._[argv._.length - 1] : undefined;
    options.input = resolveEntry(options.input, cwd, maybeEntry);
    options.enableStdIn = isCli(input) && options.input === '';
    options.name = extractName(options);
    options.loglevel = extractLogLevel(options);
    options.flags = flatten(opts.flag, options.flags);
    options.targets = flatten(opts.target, options.targets).map(target_1.getTarget);
    if (!options.targets.length) {
        options.targets.push(target_1.getTarget());
    }
    options.ghToken = options.ghToken || process.env.GITHUB_TOKEN || '';
    options.make = flatten(options.vcBuild, options.make);
    options.configure = flatten(options.configure);
    options.resources = flatten(opts.resource, options.resources);
    options.downloadOptions = options.downloadOptions || {};
    options.downloadOptions.headers = options.downloadOptions.headers || {};
    options.downloadOptions.headers['User-Agent'] = 'nexe (https://www.npmjs.com/package/nexe)';
    options.downloadOptions.agent = process.env.HTTPS_PROXY
        ? caw(process.env.HTTPS_PROXY, { protocol: 'https' })
        : options.downloadOptions.agent || require('https').globalAgent;
    options.downloadOptions.rejectUnauthorized = process.env.HTTPS_PROXY ? false : true;
    options.rc = options.rc || extractCliMap(/^rc-.*/, options);
    options.output =
        options.targets[0].platform === 'windows'
            ? (options.output || options.name).replace(/\.exe$/, '') + ".exe"
            : "" + (options.output || options.name);
    options.output = path_1.resolve(cwd, options.output);
    if (options.build) {
        var arch = options.targets[0].arch;
        if (util_1.isWindows) {
            options.make = Array.from(new Set(options.make.concat(arch)));
        }
        else {
            options.configure = Array.from(new Set(options.configure.concat(["--dest-cpu=" + arch])));
        }
    }
    var requireDefault = function (x) {
        if (typeof x === 'string') {
            return require(x).default;
        }
        return x;
    };
    options.plugins = flatten(opts.plugin, options.plugins).map(requireDefault);
    options.patches = flatten(opts.patch, options.patches).map(requireDefault);
    Object.keys(alias)
        .filter(function (k) { return k !== 'rc'; })
        .forEach(function (x) { return delete opts[x]; });
    return options;
}
exports.normalizeOptions = normalizeOptions;
