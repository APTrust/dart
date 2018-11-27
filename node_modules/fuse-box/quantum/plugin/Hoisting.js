"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const realm_utils_1 = require("realm-utils");
class Hoisting {
    constructor(core) {
        this.core = core;
    }
    start() {
        this.core.log.echoInfo(`Launch hoisting`);
        const bundleAbstractions = this.core.producerAbstraction.bundleAbstractions;
        return realm_utils_1.each(bundleAbstractions, (bundleAbstraction) => {
            const hoistedCollection = new Map();
            const actuallyHoisted = new Map();
            bundleAbstraction.identifiers.forEach((collection, identifier) => {
                if (this.core.opts.isHoistingAllowed(identifier)) {
                    const statements = new Map();
                    let firstId;
                    let firstFile;
                    collection.forEach(item => {
                        const fileID = (firstId = item.file.getID());
                        firstFile = item.file;
                        let list;
                        if (!statements.get(fileID)) {
                            list = new Set();
                            statements.set(fileID, list);
                        }
                        else {
                            list = statements.get(fileID);
                        }
                        list.add(item.statement);
                    });
                    if (statements.size === 1) {
                        const requireStatements = statements.get(firstId);
                        if (requireStatements.size > 1) {
                            this.core.log.echoInfo(`Hoisting: ${identifier} will be hoisted in bundle "${bundleAbstraction.name}"`);
                            actuallyHoisted.set(identifier, firstFile);
                            hoistedCollection.set(identifier, statements.get(firstId));
                        }
                    }
                }
            });
            bundleAbstraction.hoisted = actuallyHoisted;
            hoistedCollection.forEach((hoisted, key) => {
                hoisted.forEach(requireStatement => requireStatement.removeWithIdentifier());
            });
        });
    }
}
exports.Hoisting = Hoisting;
