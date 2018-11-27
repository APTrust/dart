"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fuse_test_runner_1 = require("fuse-test-runner");
const SparkyUtils_1 = require("./SparkyUtils");
class SparkyUtilsTest {
    "Should bump patch"() {
        const json = SparkyUtils_1.bumpVersion("package.json", {
            userJson: { version: "2.1.1" },
            type: "patch",
        });
        fuse_test_runner_1.should(json.version).equal("2.1.2");
    }
    "Should bump minor"() {
        const json = SparkyUtils_1.bumpVersion("package.json", {
            userJson: { version: "2.1.1" },
            type: "minor",
        });
        fuse_test_runner_1.should(json.version).equal("2.2.0");
    }
    "Should bump major"() {
        const json = SparkyUtils_1.bumpVersion("package.json", {
            userJson: { version: "2.1.1" },
            type: "major",
        });
        fuse_test_runner_1.should(json.version).equal("3.0.0");
    }
    "Should bump next"() {
        const json = SparkyUtils_1.bumpVersion("package.json", {
            userJson: { version: "2.1.1" },
            type: "next",
        });
        fuse_test_runner_1.should(json.version).equal("2.1.1-next.1");
    }
    "Should bump existing next"() {
        const json = SparkyUtils_1.bumpVersion("package.json", {
            userJson: { version: "2.1.1-next.1" },
            type: "next",
        });
        fuse_test_runner_1.should(json.version).equal("2.1.1-next.2");
    }
    "Should ignore next when going for patch"() {
        const json = SparkyUtils_1.bumpVersion("package.json", {
            userJson: { version: "2.1.1-next.1" },
            type: "patch",
        });
        fuse_test_runner_1.should(json.version).equal("2.1.2");
    }
    "Should ignore next when going for minor"() {
        const json = SparkyUtils_1.bumpVersion("package.json", {
            userJson: { version: "2.1.1-next.1" },
            type: "minor",
        });
        fuse_test_runner_1.should(json.version).equal("2.2.0");
    }
    "Should ignore next when going for major"() {
        const json = SparkyUtils_1.bumpVersion("package.json", {
            userJson: { version: "2.1.1-next.1" },
            type: "major",
        });
        fuse_test_runner_1.should(json.version).equal("3.0.0");
    }
}
exports.SparkyUtilsTest = SparkyUtilsTest;
