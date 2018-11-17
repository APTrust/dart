"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("../../Utils");
class QuantumBit {
    constructor(entry, requireStatement) {
        this.entry = entry;
        this.requireStatement = requireStatement;
        this.banned = false;
        this.candidates = new Map();
        this.modulesCanidates = new Map();
        this.isEntryModule = false;
        this.modules2proccess = [];
        this.files = new Map();
        this.modules = new Map();
        this.generateName();
        this.core = this.entry.core;
        this.entry.quantumBitEntry = true;
        this.isEntryModule = !this.entry.belongsToProject();
        this.requireStatement.setValue(this.name);
    }
    isNodeModules() {
        return this.requireStatement.isNodeModule;
    }
    generateName() {
        this.name = Utils_1.hashString(this.entry.getFuseBoxFullPath());
    }
    getBundleName() {
        const dest = this.core.context.quantumSplitConfig.getDest();
        return Utils_1.joinFuseBoxPath(dest, this.name);
    }
    isEligible() {
        return this.files.size > 0 || this.modules.size > 0;
    }
    dealWithModule(file, origin = false) {
        let pkg = file.packageAbstraction;
        if (!origin && file.quantumBitEntry) {
            return;
        }
        if (!this.modulesCanidates.has(pkg.name)) {
            this.modulesCanidates.set(pkg.name, pkg);
            pkg.fileAbstractions.forEach(dep => {
                if (dep.quantumBit) {
                    if (dep.quantumBit !== this) {
                        pkg.quantumBitBanned = true;
                    }
                }
                else {
                    dep.quantumBit = this;
                }
                dep.getDependencies().forEach((key, libDep) => {
                    if (libDep.belongsToExternalModule()) {
                        if (!libDep.quantumBitEntry) {
                            this.dealWithModule(libDep);
                        }
                    }
                });
                if (origin === false) {
                    dep.dependents.forEach(dependent => {
                        if (!dependent.quantumBit && dependent.packageAbstraction !== dep.packageAbstraction) {
                            pkg.quantumBitBanned = true;
                        }
                    });
                }
            });
        }
        return true;
    }
    populateDependencies(file) {
        const dependencies = file.getDependencies();
        for (const item of dependencies) {
            const dependency = item[0];
            if (dependency.belongsToProject()) {
                if (dependency.quantumBit && dependency.quantumBit !== this) {
                    dependency.referencedRequireStatements.forEach(ref => {
                        if (!ref.isDynamicImport) {
                            dependency.quantumBitBanned = true;
                        }
                    });
                }
                else {
                    dependency.quantumBit = this;
                    if (!this.candidates.has(dependency.getFuseBoxFullPath())) {
                        this.candidates.set(dependency.getFuseBoxFullPath(), dependency);
                        this.populateDependencies(dependency);
                    }
                }
            }
            else {
                this.modules2proccess.push(dependency);
            }
        }
    }
    findRootDependents(f, list) {
        if (list.indexOf(f) === -1) {
            list.push(f);
            if (f !== this.entry) {
                f.dependents.forEach(dep => {
                    this.findRootDependents(dep, list);
                });
            }
        }
        return list;
    }
    resolve(file) {
        if (this.isEntryModule) {
            this.dealWithModule(this.entry, true);
        }
        else {
            this.files.set(this.entry.getFuseBoxFullPath(), this.entry);
        }
        this.populateDependencies(this.entry);
        this.modules2proccess.forEach(dep => this.dealWithModule(dep));
        for (const p of this.candidates) {
            const file = p[1];
            const rootDependents = this.findRootDependents(file, []);
            for (const root of rootDependents) {
                if (!root.quantumBit && root !== this.entry) {
                    file.quantumBitBanned = true;
                }
                else {
                    if (root.quantumBit && root.quantumBit !== this && root !== this.entry) {
                        file.quantumBitBanned = true;
                    }
                }
            }
            if (!file.quantumBit) {
                file.quantumBitBanned = true;
            }
        }
        for (const item of this.modulesCanidates) {
            const moduleCandidate = item[1];
            moduleCandidate.fileAbstractions.forEach(file => {
                let dynamicStatementUsed = false;
                let regularStatementUsed = false;
                file.referencedRequireStatements.forEach(ref => {
                    if (ref.isDynamicImport) {
                        dynamicStatementUsed = true;
                    }
                    else {
                        regularStatementUsed = true;
                    }
                });
                if (dynamicStatementUsed && regularStatementUsed) {
                    moduleCandidate.quantumBitBanned = true;
                    if (this.entry === file) {
                        this.banned = true;
                    }
                }
            });
            if (moduleCandidate.quantumBitBanned) {
                moduleCandidate.fileAbstractions.forEach(f => {
                    f.getDependencies().forEach((key, dep) => {
                        if (dep.belongsToExternalModule()) {
                            const existingCandidate = this.modulesCanidates.get(dep.packageAbstraction.name);
                            if (existingCandidate) {
                                existingCandidate.quantumBitBanned = true;
                            }
                        }
                    });
                });
            }
        }
        this.modulesCanidates.forEach(pkg => {
            if (!pkg.quantumBitBanned) {
                pkg.fileAbstractions.forEach(f => {
                    const dependents = this.findRootDependents(f, []);
                    dependents.forEach(dep => {
                        if (!dep.quantumBit && dep !== this.entry) {
                            pkg.quantumBitBanned = true;
                        }
                        else {
                            if (dep.quantumBit && dep.quantumBit !== this && dep !== this.entry) {
                                pkg.quantumBitBanned = true;
                            }
                        }
                    });
                });
            }
        });
    }
    populate() {
        this.candidates.forEach(candidate => {
            if (!candidate.quantumBitBanned) {
                this.files.set(candidate.getFuseBoxFullPath(), candidate);
            }
        });
        this.modulesCanidates.forEach(moduleCandidate => {
            if (!moduleCandidate.quantumBitBanned) {
                this.modules.set(moduleCandidate.name, moduleCandidate);
            }
        });
    }
}
exports.QuantumBit = QuantumBit;
