"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SparkTask_1 = require("./SparkTask");
const SparkFlow_1 = require("./SparkFlow");
const realm_utils_1 = require("realm-utils");
const WorkflowContext_1 = require("../core/WorkflowContext");
const Log_1 = require("../Log");
const SparkyContext_1 = require("./SparkyContext");
const FuseBox_1 = require("../core/FuseBox");
const context = new WorkflowContext_1.WorkFlowContext();
context.doLog = process.env.SPARKY_LOG !== "false";
exports.log = new Log_1.Log(context);
class Sparky {
    static flush() {
        this.tasks = new Map();
    }
    static task(name, ...args) {
        let callback;
        let dependencies = [];
        let secondArgument = arguments[1];
        if (Array.isArray(secondArgument) || typeof secondArgument === "string") {
            dependencies = [].concat(secondArgument);
            callback = arguments[2];
        }
        else {
            callback = arguments[1];
        }
        const sparkTask = new SparkTask_1.SparkTask(name, dependencies, callback);
        this.tasks.set(name, sparkTask);
        if (this.launch === false && this.testMode === false) {
            this.launch = true;
            process.nextTick(async () => {
                await this.start();
            });
        }
        return {
            help: msg => (sparkTask.help = msg),
        };
    }
    static context(target) {
        return SparkyContext_1.SparkyContext(target);
    }
    static src(glob, opts) {
        const flow = new SparkFlow_1.SparkFlow();
        let globs = Array.isArray(glob) ? glob : [glob];
        return flow.glob(globs, opts);
    }
    static watch(glob, opts, fn) {
        const flow = new SparkFlow_1.SparkFlow();
        let globs = Array.isArray(glob) ? glob : [glob];
        return flow.watch(globs, opts, fn);
    }
    static fuse(fn) {
        process.nextTick(() => {
            const sparkyContext = SparkyContext_1.getSparkyContext();
            sparkyContext._getFuseBoxOptions = () => FuseBox_1.FuseBox.init(fn(sparkyContext));
            Object.defineProperty(sparkyContext, "fuse", {
                get: () => {
                    if (!sparkyContext._fuseInstance) {
                        sparkyContext._fuseInstance = sparkyContext._getFuseBoxOptions();
                    }
                    return sparkyContext._fuseInstance;
                },
            });
            return sparkyContext._fuseInstance;
        });
    }
    static init(paths) {
        const flow = new SparkFlow_1.SparkFlow();
        flow.createFiles(paths);
        return flow;
    }
    static async exec(...args) {
        for (const task of args) {
            if (typeof task === "string") {
                await this.resolve(task);
            }
            else {
                await task();
            }
        }
    }
    static async start(tname) {
        let start = process.hrtime();
        const taskName = tname || process.argv[2] || "default";
        if (taskName.toLowerCase() === "help") {
            Sparky.showHelp();
            return Promise.resolve();
        }
        if (!this.tasks.get(taskName)) {
            exports.log.echoWarning(`Task with such name ${taskName} was not found!`);
            return Promise.reject("Task not found");
        }
        exports.log.echoSparkyTaskStart(taskName);
        const task = this.tasks.get(taskName);
        await Promise.all([
            Promise.all(task.parallelDependencies.map(name => this.resolve(name))),
            realm_utils_1.each(task.waterfallDependencies, name => this.resolve(name)),
        ]);
        let res;
        if (typeof task.fn === "function") {
            res = await this.execute(task.fn(SparkyContext_1.getSparkyContext()));
        }
        exports.log.echoSparkyTaskEnd(taskName, process.hrtime(start));
        return res;
    }
    static execute(result) {
        if (result instanceof SparkFlow_1.SparkFlow) {
            return result.exec();
        }
        return result;
    }
    static async resolve(name) {
        if (!this.tasks.get(name)) {
            return exports.log.echoWarning(`Task with such name ${name} was not found!`);
        }
        return await this.start(name);
    }
    static showHelp() {
        exports.log
            .echoPlain("")
            .groupHeader("Usage")
            .echoPlain(`  ${process.argv[0]} [TASK] [OPTIONS...]`)
            .echoPlain("")
            .groupHeader("Available tasks");
        const maxTaskNameLength = Array.from(Sparky.tasks.keys()).reduce((acc, taskName) => Math.max(acc, taskName.length), 0);
        Sparky.tasks.forEach((task, taskName) => {
            const marginLength = maxTaskNameLength - taskName.length + 2;
            exports.log.echoSparkyTaskHelp(taskName + " ".repeat(marginLength), task.help);
        });
    }
}
Sparky.launch = false;
Sparky.testMode = false;
Sparky.tasks = new Map();
exports.Sparky = Sparky;
