import { ProducerAbstraction } from "./ProducerAbstraction";
import { PackageAbstraction } from "./PackageAbstraction";
import { FileAbstraction } from "./FileAbstraction";
import { RequireStatement } from "./nodes/RequireStatement";
export declare class BundleAbstraction {
    name: string;
    splitAbstraction: boolean;
    packageAbstractions: Map<string, PackageAbstraction>;
    producerAbstraction: ProducerAbstraction;
    globalVariableRequired: boolean;
    /**
     *
     * { "React" : [ 1,2,3,4 ] }
     *
     * @memberof BundleAbstraction
     */
    identifiers: Map<string, Set<{
        statement: RequireStatement;
        file: FileAbstraction;
    }>>;
    hoisted: Map<string, FileAbstraction>;
    constructor(name: string);
    registerHoistedIdentifiers(identifier: string, statement: RequireStatement, file: FileAbstraction): void;
    registerPackageAbstraction(packageAbstraction: PackageAbstraction): void;
    parse(contents: string): void;
}
