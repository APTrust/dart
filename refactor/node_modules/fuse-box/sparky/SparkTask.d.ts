export declare class SparkTask {
    name: string;
    fn: any;
    parallelDependencies: string[];
    waterfallDependencies: string[];
    help: string;
    constructor(name: string, dependencies: string[], fn: any);
}
