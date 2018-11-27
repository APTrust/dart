"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FlatFileGenerator_1 = require("./FlatFileGenerator");
const realm_utils_1 = require("realm-utils");
const StatementModifaction_1 = require("./modifications/StatementModifaction");
const EnvironmentConditionModification_1 = require("./modifications/EnvironmentConditionModification");
const BundleWriter_1 = require("./BundleWriter");
const InteropModifications_1 = require("./modifications/InteropModifications");
const UseStrictModification_1 = require("./modifications/UseStrictModification");
const BundleAbstraction_1 = require("../core/BundleAbstraction");
const PackageAbstraction_1 = require("../core/PackageAbstraction");
const ResponsiveAPI_1 = require("./ResponsiveAPI");
const TypeOfModifications_1 = require("./modifications/TypeOfModifications");
const TreeShake_1 = require("./TreeShake");
const ProcessEnvModification_1 = require("./modifications/ProcessEnvModification");
const Utils_1 = require("../../Utils");
const ComputerStatementRule_1 = require("./ComputerStatementRule");
const Bundle_1 = require("../../core/Bundle");
const DynamicImportStatements_1 = require("./modifications/DynamicImportStatements");
const Hoisting_1 = require("./Hoisting");
const CSSModifications_1 = require("./modifications/CSSModifications");
const QuantumTask_1 = require("../core/QuantumTask");
const GlobalProcessReplacement_1 = require("./modifications/GlobalProcessReplacement");
const GlobalProcessVersionReplacement_1 = require("./modifications/GlobalProcessVersionReplacement");
class QuantumCore {
    constructor(producer, opts) {
        this.producer = producer;
        this.index = 0;
        this.postTasks = new QuantumTask_1.QuantumTask(this);
        this.cssCollection = new Map();
        this.writer = new BundleWriter_1.BundleWriter(this);
        this.requiredMappings = new Set();
        this.quantumBits = new Map();
        this.customStatementSolutions = new Set();
        this.computedStatementRules = new Map();
        this.splitFiles = new Set();
        this.opts = opts;
        this.api = new ResponsiveAPI_1.ResponsiveAPI(this);
        this.log = producer.fuse.context.log;
        this.log.echoBreak();
        this.log.groupHeader("Launching quantum core");
        if (this.opts.apiCallback) {
            this.opts.apiCallback(this);
        }
        this.context = this.producer.fuse.context;
    }
    solveComputed(path, rules) {
        this.customStatementSolutions.add(Utils_1.string2RegExp(path));
        if (rules && rules.mapping) {
            this.requiredMappings.add(Utils_1.string2RegExp(rules.mapping));
        }
        this.computedStatementRules.set(path, new ComputerStatementRule_1.ComputedStatementRule(path, rules));
    }
    getCustomSolution(file) {
        let fullPath = file.getFuseBoxFullPath();
        let computedRule = this.computedStatementRules.get(fullPath);
        if (computedRule) {
            return computedRule;
        }
    }
    async consume() {
        this.log.echoInfo("Generating abstraction, this may take a while");
        const abstraction = await this.producer.generateAbstraction({
            quantumCore: this,
            customComputedStatementPaths: this.customStatementSolutions,
        });
        abstraction.quantumCore = this;
        this.producerAbstraction = abstraction;
        this.log.echoInfo("Abstraction generated");
        await realm_utils_1.each(abstraction.bundleAbstractions, (bundleAbstraction) => {
            return this.prepareFiles(bundleAbstraction);
        });
        await realm_utils_1.each(abstraction.bundleAbstractions, (bundleAbstraction) => {
            return this.processBundle(bundleAbstraction);
        });
        await this.postTasks.execute();
        await this.prepareQuantumBits();
        await this.treeShake();
        await this.processCSS();
        await this.postTasks.execute();
        await this.render();
        this.compriseAPI();
        await this.writer.process();
        this.printStat();
    }
    ensureBitBundle(bit) {
        let bundle;
        if (!this.producer.bundles.get(bit.name)) {
            this.log.echoInfo(`Create split bundle ${bit.name} with entry point ${bit.entry.getFuseBoxFullPath()}`);
            const fusebox = this.context.fuse.copy();
            bundle = new Bundle_1.Bundle(bit.getBundleName(), fusebox, this.producer);
            bundle.quantumBit = bit;
            this.producer.bundles.set(bit.name, bundle);
            bundle.webIndexed = false;
            const bnd = new BundleAbstraction_1.BundleAbstraction(bit.name);
            bnd.splitAbstraction = true;
            let pkg = new PackageAbstraction_1.PackageAbstraction(bit.entry.packageAbstraction.name, bnd);
            this.producerAbstraction.registerBundleAbstraction(bnd);
            bundle.bundleAbstraction = bnd;
            bundle.packageAbstraction = pkg;
        }
        else {
            bundle = this.producer.bundles.get(bit.name);
        }
        return bundle;
    }
    async prepareQuantumBits() {
        this.context.quantumBits = this.quantumBits;
        this.quantumBits.forEach(bit => {
            bit.resolve();
        });
        await realm_utils_1.each(this.quantumBits, async (bit, key) => {
            bit.populate();
            bit.files.forEach(file => {
                if (file.quantumBitEntry && file.quantumBitBanned) {
                    bit.banned = true;
                }
            });
            if (bit.banned) {
                this.log.echoInfo(`QuantumBit: Ignoring import of ${bit.entry.getFuseBoxFullPath()}`);
                return;
            }
            let bundle = this.ensureBitBundle(bit);
            bit.files.forEach(file => {
                this.log.echoInfo(`QuantumBit: Adding ${file.getFuseBoxFullPath()} to ${bit.name}`);
                file.packageAbstraction.fileAbstractions.delete(file.fuseBoxPath);
                bundle.packageAbstraction.registerFileAbstraction(file);
                file.packageAbstraction = bundle.packageAbstraction;
            });
            bit.modules.forEach(pkg => {
                this.log.echoInfo(`QuantumBit: Moving module ${pkg.name} from ${pkg.bundleAbstraction.name} to ${bit.name}`);
                const bundleAbstraction = bundle.bundleAbstraction;
                pkg.assignBundle(bundleAbstraction);
            });
        });
    }
    printStat() {
        if (this.opts.shouldShowWarnings()) {
            this.producerAbstraction.warnings.forEach(warning => {
                this.log.echoBreak();
                this.log.echoYellow("Warnings:");
                this.log.echoYellow("Your quantum bundle might not work");
                this.log.echoYellow(`  - ${warning.msg}`);
                this.log.echoGray("");
                this.log.echoGray("  * Set { warnings : false } if you want to hide these messages");
                this.log.echoGray("  * Read up on the subject https://fuse-box.org/docs/production-builds/quantum-configuration#computed-statement-resolution");
            });
        }
    }
    compriseAPI() {
        if (this.producerAbstraction.useComputedRequireStatements) {
            this.api.addComputedRequireStatetements();
        }
    }
    handleMappings(fuseBoxFullPath, id) {
        this.requiredMappings.forEach(regexp => {
            if (regexp.test(fuseBoxFullPath)) {
                this.api.addMapping(fuseBoxFullPath, id);
            }
        });
    }
    prepareFiles(bundleAbstraction) {
        bundleAbstraction.packageAbstractions.forEach(packageAbstraction => {
            let entryId = `${this.producer.entryPackageName}/${packageAbstraction.entryFile}`;
            packageAbstraction.fileAbstractions.forEach((fileAbstraction, key) => {
                let fileId = fileAbstraction.getFuseBoxFullPath();
                const id = this.index;
                this.handleMappings(fileId, id);
                this.index++;
                if (fileId === entryId) {
                    fileAbstraction.setEntryPoint();
                }
                fileAbstraction.setID(id);
            });
        });
    }
    async processBundle(bundleAbstraction) {
        this.log.echoInfo(`Process bundle ${bundleAbstraction.name}`);
        await realm_utils_1.each(bundleAbstraction.packageAbstractions, (packageAbstraction) => {
            const fileSize = packageAbstraction.fileAbstractions.size;
            this.log.echoInfo(`Process package ${packageAbstraction.name} `);
            this.log.echoInfo(`  Files: ${fileSize} `);
            return realm_utils_1.each(packageAbstraction.fileAbstractions, (fileAbstraction) => {
                return this.modify(fileAbstraction);
            });
        });
        await this.hoist();
    }
    async processCSS() {
        if (!this.opts.shouldGenerateCSS()) {
            return;
        }
        await realm_utils_1.each(this.producerAbstraction.bundleAbstractions, (bundleAbstraction) => {
            return realm_utils_1.each(bundleAbstraction.packageAbstractions, (packageAbstraction) => {
                return realm_utils_1.each(packageAbstraction.fileAbstractions, (fileAbstraction) => {
                    if (!fileAbstraction.canBeRemoved) {
                        return CSSModifications_1.CSSModifications.perform(this, fileAbstraction);
                    }
                });
            });
        });
    }
    treeShake() {
        if (this.opts.shouldTreeShake()) {
            const shaker = new TreeShake_1.TreeShake(this);
            return shaker.shake();
        }
    }
    render() {
        return realm_utils_1.each(this.producerAbstraction.bundleAbstractions, (bundleAbstraction) => {
            const globals = this.producer.fuse.context.globals;
            const globalFileMap = {};
            const generator = new FlatFileGenerator_1.FlatFileGenerator(this, bundleAbstraction);
            generator.init();
            return realm_utils_1.each(bundleAbstraction.packageAbstractions, (packageAbstraction) => {
                return realm_utils_1.each(packageAbstraction.fileAbstractions, (fileAbstraction) => {
                    if (fileAbstraction.fuseBoxPath == packageAbstraction.entryFile &&
                        globals &&
                        Object.keys(globals).indexOf(packageAbstraction.name) != -1) {
                        globalFileMap[packageAbstraction.name] = fileAbstraction.getID();
                    }
                    return generator.addFile(fileAbstraction, this.opts.shouldEnsureES5());
                });
            }).then(() => {
                if (globals) {
                    Object.keys(globals).forEach(globalPackageName => {
                        if (globalFileMap[globalPackageName] !== undefined) {
                            generator.setGlobals(globals[globalPackageName], globalFileMap[globalPackageName]);
                        }
                    });
                }
                this.log.echoInfo(`Render bundle ${bundleAbstraction.name}`);
                const bundleCode = generator.render();
                this.producer.bundles.get(bundleAbstraction.name).generatedCode = new Buffer(bundleCode);
            });
        });
    }
    hoist() {
        if (!this.api.hashesUsed() && this.opts.shouldDoHoisting()) {
            let hoisting = new Hoisting_1.Hoisting(this);
            return hoisting.start();
        }
    }
    modify(file) {
        const modifications = [
            StatementModifaction_1.StatementModification,
            DynamicImportStatements_1.DynamicImportStatementsModifications,
            EnvironmentConditionModification_1.EnvironmentConditionModification,
            InteropModifications_1.InteropModifications,
            UseStrictModification_1.UseStrictModification,
            TypeOfModifications_1.TypeOfModifications,
            ProcessEnvModification_1.ProcessEnvModification,
            GlobalProcessReplacement_1.GlobalProcessReplacement,
            GlobalProcessVersionReplacement_1.GlobalProcessVersionReplacement,
        ];
        return realm_utils_1.each(modifications, (modification) => modification.perform(this, file));
    }
}
exports.QuantumCore = QuantumCore;
