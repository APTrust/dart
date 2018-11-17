/**
 * Registers given module names as being stateful
 * @param isStateful for a given moduleName returns true if the module is stateful
 */
export declare const setStatefulModules: (isStateful: (moduleName: string) => boolean) => void;
