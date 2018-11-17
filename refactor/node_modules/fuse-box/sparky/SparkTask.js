"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SparkTask {
    constructor(name, dependencies, fn) {
        this.name = name;
        this.fn = fn;
        this.parallelDependencies = [];
        this.waterfallDependencies = [];
        this.help = "";
        dependencies.forEach(dependency => {
            if (dependency.charAt(0) === "&") {
                dependency = dependency.slice(1);
                this.parallelDependencies.push(dependency);
            }
            else {
                this.waterfallDependencies.push(dependency);
            }
        });
    }
}
exports.SparkTask = SparkTask;
