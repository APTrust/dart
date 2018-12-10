const { BagItProfile } = require('../bagit/bagit_profile');
const CLI = require('./cli_constants');
var dateFormat = require('dateformat');
const { Validator } = require('../bagit/validator');

class BagValidator {

    constructor(opts) {
        this.opts = opts;
        this.exitCode = CLI.EXIT_SUCCESS;
    }

    run() {
        var bagValidator = this;
        this.validateOpts();
        return new Promise(function(resolve, reject) {
            let profile = BagItProfile.load(bagValidator.opts.profile);
            let validator = new Validator(bagValidator.opts.bag, profile);
            validator.on('error', function(err) {
                bagValidator.exitCode = CLI.EXIT_RUNTIME_ERROR;
                resolve(validator);
            });
            validator.on('end', function() {
                if (validator.errors.length > 0) {
                    bagValidator.exitCode = CLI.EXIT_COMPLETED_WITH_ERRORS;
                    console.log("Bag has the following errors:");
                    for (let e of validator.errors) {
                        console.log(`    ${e}`);
                    }
                } else {
                    console.log('Bag is valid.');
                }
                resolve(validator);
            });
            if (bagValidator.opts.debug) {
                validator.on('task', function(taskDesc) {
                    let ts = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss.l");
                    let msg = taskDesc.msg || '';
                    console.log(`  [debug] [${ts}] ${taskDesc.op} ${taskDesc.path} ${msg}`);
                });
            }
            validator.validate();
        });
    }

    validateOpts() {
        if (!this.opts.profile) {
            throw "Missing required option [-p | --profile] <path to BagIt profile>";
        }
        if (this.opts._.length == 0 || this.opts._[0] == "") {
            let err = `Missing final argument path/to/bag.
Example: dart-cli --command validate-bag --profile path/to/profile.json path/to/bag`;
            throw err
        }
    }
}

module.exports.BagValidator = BagValidator;
