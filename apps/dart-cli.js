const { BagItProfile } = require('../bagit/bagit_profile');
var dateFormat = require('dateformat');
const minimist = require('minimist')
const { Validator } = require('../bagit/validator');

const EXIT_SUCCESS = 0;
const EXIT_COMPLETED_WITH_ERRORS = 1;
const EXIT_INVALID_PARAMS = 2;
const EXIT_RUNTIME_ERROR = 3;
const VALID_COMMANDS = ["validate-bag", "validate-profile", "run-job"]


async function main() {
    process.exitCode = EXIT_SUCCESS;
    let opts = parseArgs();
    if (opts.command == "validate-bag") {
        let validator = await validateBag(opts);
        if (validator.errors.length == 0) {
            console.log("Bag is valid")
        } else {
            console.log("Bag has the following errors:");
            for (let e of validator.errors) {
                console.log(`    ${e}`);
                process.exitCode = EXIT_COMPLETED_WITH_ERRORS;
            }
        }
    } else if (opts.command == "validate-profile") {
        validateProfile(opts);
    }
}

function validateBag(opts) {
    return new Promise(function(resolve, reject) {
        let profile = BagItProfile.load(opts.profile);
        let validator = new Validator(opts.bag, profile);
        validator.on('error', function(err) {
            resolve(validator);
        });
        validator.on('end', function() {
            resolve(validator);
        });
        if (opts.debug) {
            validator.on('task', function(taskDesc) {
                let ts = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss.l");
                console.log(`  [debug] [${ts}] ${taskDesc.op} ${taskDesc.path}`);
            });
        }
        validator.validate();
    });
}

function validateProfile(opts) {
    let profile = BagItProfile.load(opts.profile);
    let result = profile.validate();
    if (result.isValid()) {
        console.log("BagItProfile is valid.");
    } else {
        console.log("BagItProfile has the following errors:");
        for (let [key, value] of Object.entries(result.errors)) {
            console.log(`    ${key}: ${value}`);
        }
        process.exitCode = EXIT_COMPLETED_WITH_ERRORS;
    }
}

// TODO: Move this to seperate file.
function parseArgs() {
    let opts = minimist(process.argv.slice(2), {
        string: ['bag', 'profile', 'job'],
        boolean: ['d', 'debug', 'h', 'help'],
        default: { d: false, debug: false, h: false, help: false},
        alias: { d: ['debug'], p: ['profile'], v: ['version'], h: ['help'], c: ['command']}
    });
    if (opts.help) {
        printUsage();
        process.exit(0);
    }
    if (opts.version) {
        printVersion();
        process.exit(0);
    }
    if (opts.command == "") {
        exitWithError(EXIT_INVALID_PARAMS, "Missing required option [-c | -command] <${VALID_COMMANDS.join('|')}>.");
    }
    if (!VALID_COMMANDS.includes(opts.command)) {
        exitWithError(EXIT_INVALID_PARAMS, "Invalid command ${opts.command}");
    }
    if (opts.command == "validate-bag" && !opts.profile) {
         exitWithError(EXIT_INVALID_PARAMS, "Missing required option [-p | --profile] <path to BagIt profile>");
    }
    if (opts._.length == 0 || opts._[0] == "") {
        let missingParam = "path/to/bag";
        let sample = `Example: dart-cli --command validate-bag --profile path/to/profile.json path/to/bag`;
        if (opts.c == "validate-profile") {
            missingParam = "path/to/profile.json";
            sample = `Example: dart-cli --command validate-profile path/to/profile.json`;
        } else if (opts.c == "run-job") {
            missingParam = "path/to/job_file.json";
            sample = `Example: dart-cli --command run-job path/to/job_file.json`;
        }
        exitWithError(EXIT_INVALID_PARAMS, `Missing final argument ${missingParam}\n${sample}`);
    } else {
        if (opts.c == "validate-bag") {
            opts.bag = opts._[0];
        } else if (opts.c == "validate-profile") {
            opts.profile = opts._[0];
        } else if (opts.c == "run-job") {
            opts.job = opts._[0];
        }

    }
    return opts;
}

function printVersion() {
    console.log("dart-validator version 1.0");
    console.log(`Node ${process.platform} ${process.arch} ${process.version}`);
}

function printUsage() {
    console.log(`

dart-cli - DART command line interface.

  Validate BagIt packages according to a BagIt profile.

  Usage: dart-cli -- -c <cmd> -p path/to/bagit/profile.json [-v] path/to/bag

  *** Note the double dashes before the first option in the command line. ***

OPTIONS:

  -c --command   Required. The command to run. This should be one of:

                 validate-profile: Validate a BagIt profile.

                 validate-bag: Validate a bag according to some BagIt profile.

                 run-job: Run a DART job, which includes packaging and
                 uploading a bag.

  -d --debug     Optional. If specified, the validator will send verbose output
                 to stdout.
  -h --help      Optional. Prints this message and exits.
  -p --profile   Required. Path to BagIt profile json file that describes what
                 constitutes a valid bag.
  -v --version   Optional. Prints version and exits.

The final command line parameter is the path to the bag, which can be a
directory or a tar file.

EXIT CODES:

  0   Process completed normally. If the --help or --version flag was specified,
      the program printed a message and exited. Otherwise, operation completed
      successfully.
  1   Process completed normally, but the outcome was not successful. For
      example, a bag or profile was validated and found to have errors.
  2   Missing or invalid command line options. Operation not attempted.
  3   Operation was attempted but failed due to an unexpected error such as a
      missing or unreadable profile or bag.

`);
}

function exitWithError(code, message) {
    console.error(message);
    process.exit(code);
}

if (!module.parent) {
    main();
}
