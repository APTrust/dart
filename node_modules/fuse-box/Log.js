"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log = require("fliplog");
const prettysize = require("prettysize");
const prettyTime = require("pretty-time");
const zlib = require("zlib");
const Utils_1 = require("./Utils");
class Indenter {
    constructor() {
        this.store = new Map();
        this.set("indent", 0);
    }
    set(key, val) {
        this.store.set(key, val);
        return this;
    }
    get(key) {
        return this.store.get(key);
    }
    reset() {
        return this.set("indent", 0);
    }
    tap(key, cb) {
        const updated = cb(this.store.get(key));
        return this.set(key, updated);
    }
    indent(level) {
        return this.tap("indent", indent => indent + level);
    }
    level(level) {
        return this.set("indent", level);
    }
    toString() {
        return " ".repeat(this.get("indent"));
    }
    toNumber() {
        return this.get("indent");
    }
    [Symbol.toPrimitive](hint) {
        if (hint === "number") {
            return this.toNumber();
        }
        return this.toString();
    }
}
exports.Indenter = Indenter;
class Log {
    constructor(context) {
        this.context = context;
        this.timeStart = process.hrtime();
        this.printLog = true;
        this.showBundledFiles = true;
        this.debugMode = false;
        this.indent = new Indenter();
        this.totalSize = 0;
        this.printLog = context.doLog;
        this.debugMode = context.debugMode;
        log.filter(arg => {
            const debug = this.debugMode;
            const level = this.printLog;
            const hasTag = tag => arg.tags.includes(tag);
            const levelHas = tag => debug || (level && level.includes && level.includes(tag) && !level.includes("!" + tag));
            if (level === false) {
                return false;
            }
            if (level === true && debug === true) {
                return null;
            }
            if (level === "error") {
                if (!hasTag("error")) {
                    return false;
                }
            }
            if (hasTag("magic")) {
                if (!levelHas("magic")) {
                    return false;
                }
            }
            if (hasTag("filelist")) {
                if (!levelHas("filelist")) {
                    return false;
                }
            }
            return null;
        });
        setTimeout(() => {
            if (this.printLog) {
                Log.deferred.forEach(x => x(this));
            }
            Log.deferred = [];
        });
    }
    static defer(fn) {
        Log.deferred.push(fn);
    }
    reset() {
        this.timeStart = process.hrtime();
        this.totalSize = 0;
        this.indent.reset();
        return this;
    }
    printOptions(title, obj) {
        const indent = this.indent.level(2) + "";
        const indent2 = this.indent.level(4) + "";
        log.addPreset("min", instance => {
            instance.formatter(data => {
                return log
                    .inspector()(data)
                    .split("\n")
                    .map(data2 => indent2 + data2)
                    .map(data2 => data2.replace(/[{},]/, ""))
                    .join("\n");
            });
        });
        log
            .bold()
            .yellow(`${indent}→ ${title}\n`)
            .preset("min")
            .data(obj)
            .echo();
        return this;
    }
    clearTerminal() {
        console.log("\x1Bc");
    }
    bundleStart(name) {
        log.gray(``).echo();
        log.gray(`--------------------------`).echo();
        log.magenta(`Bundle "${name}" `).echo();
        log.gray(``).echo();
        return this;
    }
    subBundleStart(name, parent) {
        log.bold(`${name} (child of ${parent}) ->`).echo();
        return this;
    }
    bundleEnd(name, collection) {
        const took = process.hrtime(this.timeStart);
        log
            .ansi()
            .write(`-> Finished`)
            .green(collection.cachedName || collection.name)
            .yellow(`took: ${prettyTime(took, "ms")}`)
            .echo();
    }
    startSpinner(text) {
        if (!this.printLog) {
            return this;
        }
        const indentStr = this.indent.toString();
        const indent = +this.indent;
        const interval = 20;
        const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"].map(frame => indentStr + frame);
        const spinner = { frames, interval };
        this.spinner = log.requirePkg("ora")({ text, indent, spinner });
        this.spinner.start();
        this.spinner.indent = +this.indent;
        this.spinner.succeeded = false;
        setTimeout(() => {
            if (this.spinner.succeeded === false && this.spinner.fail) {
                this.spinner.fail();
            }
        }, 1000);
        return this;
    }
    stopSpinner(text) {
        if (!this.printLog) {
            return this;
        }
        if (this.spinner && this.spinner.succeeded === false) {
            this.spinner.succeeded = true;
            const reference = this.spinner;
            const indent = this.indent.level(this.spinner.indent).toString();
            const success = log.chalk().green(`${indent}✔ `);
            text = text || reference.text;
            reference.stopAndPersist({ symbol: success, text });
        }
        return this;
    }
    echoDefaultCollection(collection, contents) {
        if (this.printLog === false) {
            return this;
        }
        const bytes = Buffer.byteLength(contents, "utf8");
        const size = prettysize(bytes);
        this.totalSize += bytes;
        const indent = this.indent
            .reset()
            .indent(+1)
            .toString();
        if (this.showBundledFiles) {
            const dependencies = new Map(Array.from(collection.dependencies).sort());
            dependencies.forEach(file => {
                if (file.info.isRemoteFile) {
                    return;
                }
                const indentItem = this.indent.level(4).toString();
                log
                    .white(`${indentItem}${file.info.fuseBoxPath}`)
                    .echo();
            });
        }
        log
            .ansi()
            .write(`└──`)
            .yellow(`${indent}(${collection.dependencies.size} files,  ${size})`)
            .green(collection.cachedName || collection.name)
            .echo();
        this.indent.level(0);
        return this;
    }
    echoCollection(collection, contents) {
        if (this.printLog === false) {
            return this;
        }
        const bytes = Buffer.byteLength(contents, "utf8");
        const size = prettysize(bytes);
        this.totalSize += bytes;
        const indent = this.indent.toString();
        const name = (collection.cachedName || collection.name).trim();
        log
            .ansi()
            .write(`${indent}└──`)
            .green(name)
            .yellow(size)
            .write(`(${collection.dependencies.size} files)`)
            .echo();
        return this;
    }
    end(header) {
        const took = process.hrtime(this.timeStart);
        this.echoBundleStats(header || "Bundle", this.totalSize, took);
        return this;
    }
    echoGzip(size, msg = "") {
        if (!size) {
            return this;
        }
        const yellow = log.chalk().yellow;
        const gzipped = zlib.gzipSync(size, { level: 9 }).length;
        const gzippedSize = prettysize(gzipped) + " (gzipped)";
        const compressedSize = prettysize(size.length);
        const prettyGzip = yellow(`${compressedSize}, ${gzippedSize}`);
        log
            .title(this.indent + "")
            .when(msg, () => log.text(msg), () => log.bold("size: "))
            .data(prettyGzip)
            .echo();
        return this;
    }
    echoBundleStats(header, size, took) {
        this.indent.reset();
        const yellow = log.chalk().yellow;
        const sized = yellow(`${prettysize(size)}`);
        log.text(`size: ${sized} in ${prettyTime(took, "ms")}`).echo();
        return this;
    }
    echoHeader(str) {
        this.indent.level(1);
        log.yellow(`${this.indent}${str}`).echo();
        return this;
    }
    echoSparkyTaskStart(taskName) {
        const gray = log.chalk().gray;
        const magenta = log.chalk().magenta;
        const str = ["[", gray(Utils_1.getDateTime()), "]", " Starting"];
        str.push(` '${magenta(taskName)}' `);
        console.log(str.join(""));
        return this;
    }
    echoSparkyTaskEnd(taskName, took) {
        const gray = log.chalk().gray;
        const magenta = log.chalk().magenta;
        const str = ["[", gray(Utils_1.getDateTime()), "]", " Resolved"];
        str.push(` '${magenta(taskName)}' `, "after ");
        str.push(`${gray(prettyTime(took, "ms"))}`);
        console.log(str.join(""));
        return this;
    }
    echoStatus(str) {
        log
            .title(`→`)
            .cyan(`${str}`)
            .echo();
        return this;
    }
    echoSparkyTaskHelp(taskName, taskHelp) {
        log
            .ansi()
            .write(" ")
            .cyan(taskName)
            .white(taskHelp)
            .echo();
    }
    groupHeader(str) {
        log
            .color("bold.underline")
            .text(`${str}`)
            .echo();
        return this;
    }
    echoInfo(str) {
        const indent = this.indent.level(2);
        log
            .preset("info")
            .green(`${indent}→ ${str}`)
            .echo();
        return this;
    }
    error(error) {
        log
            .tags("error")
            .data(error)
            .echo();
        return this;
    }
    magicReason(str, metadata = false) {
        if (metadata) {
            log.data(metadata);
        }
        log
            .tags("magic")
            .magenta(str)
            .echo();
        return this;
    }
    echo(str) {
        log
            .time(true)
            .green(str)
            .echo();
        return this;
    }
    echoPlain(str) {
        log.text(str).echo();
        return this;
    }
    echoBoldRed(msg) {
        log
            .red()
            .bold(msg)
            .echo();
        return this;
    }
    echoError(str) {
        log.red(`  → ERROR ${str}`).echo();
    }
    echoRed(msg) {
        log.red(msg).echo();
        return this;
    }
    echoBreak() {
        log.green(`\n  -------------- \n`).echo();
        return this;
    }
    echoWarning(str) {
        log.yellow(`  → WARNING ${str}`).echo();
        return this;
    }
    echoYellow(str) {
        log.yellow(str).echo();
        return this;
    }
    echoGray(str) {
        log.gray(str).echo();
        return this;
    }
}
Log.deferred = [];
exports.Log = Log;
