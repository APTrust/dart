import { WorkFlowContext } from "./WorkflowContext";
import { ScriptTarget } from "./File";
export declare class TypescriptConfig {
    context: WorkFlowContext;
    private config;
    private customTsConfig;
    private configFile;
    constructor(context: WorkFlowContext);
    getConfig(): any;
    private defaultSetup;
    forceCompilerTarget(level: ScriptTarget): void;
    setConfigFile(customTsConfig: string): void;
    private initializeConfig;
    private verifyTsLib;
    read(): void;
}
