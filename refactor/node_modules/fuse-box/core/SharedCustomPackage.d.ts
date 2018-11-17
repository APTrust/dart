import { BundleData } from "../arithmetic/Arithmetic";
export declare class SharedCustomPackage {
    name: string;
    data: BundleData;
    homeDir: string;
    main: string;
    mainPath: any;
    mainDir: any;
    constructor(name: string, data: BundleData);
    init(homeDir: string, main: string): void;
}
