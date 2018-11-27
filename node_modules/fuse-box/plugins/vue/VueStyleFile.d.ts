import { VueBlockFile } from "./VueBlockFile";
export declare class VueStyleFile extends VueBlockFile {
    fixSourceMapName(): void;
    private applyScopeIdToStyles;
    process(): Promise<void>;
}
