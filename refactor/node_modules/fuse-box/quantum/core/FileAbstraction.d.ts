import { QuantumBit } from "../plugin/QuantumBit";
import { QuantumCore } from "../plugin/QuantumCore";
import { ExportsInterop } from "./nodes/ExportsInterop";
import { GenericAst } from "./nodes/GenericAst";
import { NamedExport } from "./nodes/NamedExport";
import { ReplaceableBlock } from "./nodes/ReplaceableBlock";
import { RequireStatement } from "./nodes/RequireStatement";
import { TypeOfExportsKeyword } from "./nodes/TypeOfExportsKeyword";
import { TypeOfModuleKeyword } from "./nodes/TypeOfModuleKeyword";
import { TypeOfWindowKeyword } from "./nodes/TypeOfWindowKeyword";
import { UseStrict } from "./nodes/UseStrict";
import { PackageAbstraction } from "./PackageAbstraction";
export declare class FileAbstraction {
    fuseBoxPath: string;
    packageAbstraction: PackageAbstraction;
    dependents: Set<FileAbstraction>;
    ast: any;
    fuseBoxDir: any;
    referencedRequireStatements: Set<RequireStatement>;
    isEcmaScript6: boolean;
    shakable: boolean;
    amountOfReferences: number;
    canBeRemoved: boolean;
    quantumBitEntry: boolean;
    quantumBitBanned: boolean;
    quantumDynamic: boolean;
    quantumBit: QuantumBit;
    namedRequireStatements: Map<string, RequireStatement>;
    /** FILE CONTENTS */
    requireStatements: Set<RequireStatement>;
    dynamicImportStatements: Set<RequireStatement>;
    fuseboxIsEnvConditions: Set<ReplaceableBlock>;
    definedLocally: Set<string>;
    exportsInterop: Set<ExportsInterop>;
    useStrict: Set<UseStrict>;
    typeofExportsKeywords: Set<TypeOfExportsKeyword>;
    typeofModulesKeywords: Set<TypeOfModuleKeyword>;
    typeofWindowKeywords: Set<TypeOfWindowKeyword>;
    typeofGlobalKeywords: Set<GenericAst>;
    typeofDefineKeywords: Set<GenericAst>;
    typeofRequireKeywords: Set<GenericAst>;
    globalProcess: Set<GenericAst>;
    globalProcessVersion: Set<GenericAst>;
    processVariableDefined: boolean;
    namedExports: Map<string, NamedExport>;
    processNodeEnv: Set<ReplaceableBlock>;
    core: QuantumCore;
    isEntryPoint: boolean;
    wrapperArguments: string[];
    localExportUsageAmount: Map<string, number>;
    private globalVariables;
    private id;
    private treeShakingRestricted;
    private removalRestricted;
    private dependencies;
    renderedHeaders: string[];
    constructor(fuseBoxPath: string, packageAbstraction: PackageAbstraction);
    isProcessPolyfill(): boolean;
    registerHoistedIdentifiers(identifier: string, statement: RequireStatement, resolvedFile: FileAbstraction): void;
    getFuseBoxFullPath(): string;
    isNotUsedAnywhere(): boolean;
    releaseDependent(file: FileAbstraction): void;
    markForRemoval(): void;
    /**
     * Initiates an abstraction from string
     */
    loadString(contents: string): void;
    setID(id: any): void;
    belongsToProject(): boolean;
    belongsToExternalModule(): boolean;
    getID(): string;
    isTreeShakingAllowed(): boolean;
    restrictRemoval(): void;
    isRemovalAllowed(): boolean;
    restrictTreeShaking(): void;
    addDependency(file: FileAbstraction, statement: RequireStatement): void;
    getDependencies(): Map<FileAbstraction, Set<RequireStatement>>;
    /**
     * Initiates with AST
     */
    loadAst(ast: any): void;
    /**
     * Finds require statements with given mask
     */
    findRequireStatements(exp: RegExp): RequireStatement[];
    wrapWithFunction(args: string[]): void;
    /**
     * Return true if there is even a single require statement
     */
    isRequireStatementUsed(): boolean;
    isDynamicStatementUsed(): boolean;
    isDirnameUsed(): boolean;
    isFilenameUsed(): boolean;
    isExportStatementInUse(): boolean;
    isModuleStatementInUse(): boolean;
    isExportInUse(): boolean;
    setEntryPoint(): void;
    generate(ensureEs5?: boolean): any;
    /**
     *
     * @param node
     * @param parent
     * @param prop
     * @param idx
     */
    private onNode;
    private detectLocallyDefinedSystemVariables;
    analyse(): void;
}
