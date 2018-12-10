const { BagItProfile } = require('../bagit/bagit_profile');
const CLI = require('./cli_constants');

class ProfileValidator {

    constructor(opts) {
        this.opts = opts;
        this.exitCode = CLI.EXIT_SUCCESS;
    }

    run() {
        let profile = BagItProfile.load(this.opts.profile);
        let result = profile.validate();
        if (result.isValid()) {
            console.log("BagItProfile is valid.");
        } else {
            console.log("BagItProfile has the following errors:");
            for (let [key, value] of Object.entries(result.errors)) {
                console.log(`    ${key}: ${value}`);
            }
            process.exitCode = CLI.EXIT_COMPLETED_WITH_ERRORS;
        }
    }

    validateOpts() {
        if (this.opts._.length == 0 || this.opts._[0] == "") {
            let err = "Missing param path/to/profile.json\n";
            err += "Example: dart-cli --command validate-profile path/to/profile.json\n";
            throw err;
        }
    }
}

module.exports.ProfileValidator = ProfileValidator;
