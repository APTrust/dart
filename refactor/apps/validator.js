const { BagItProfile } = require('../bagit/bagit_profile');
const minimist = require('minimist')
const { Validator } = require('../bagit/validator');

async function main() {
    let exitCode = 0;
    let opts = parseArgs();
    let validator = await validate(opts);
    if (validator.errors.length == 0) {
        console.log("Bag is valid")
    } else {
        console.log("Bag has the following errors:");
        for (let e of validator.errors) {
            console.log(e);
            exitCode = 1;
        }
    }
    return exitCode;
}

// TODO: Promise/resolve... else this doesn't work!

function validate(opts) {
    return new Promise(function(resolve, reject) {
        let profile = BagItProfile.load(opts.profile);
        let validator = new Validator(opts.bag, profile);
        validator.on('error', function(err) {
            exitWithError(3, err);
        });
        validator.on('end', function() {
            resolve(validator);
        });
        validator.validate();
    });
}

function parseArgs() {
    let opts = minimist(process.argv.slice(2), {
        boolean: ['d', 'debug', 'h', 'help'],
        default: { d: false, debug: false, h: false, help: false},
        alias: { d: ['debug'], p: ['profile'], v: ['version'], h: ['help']}
    });
    if (opts.help) {
        printUsage();
        process.exit(0);
    }
    if (opts.version) {
        printVersion();
        process.exit(0);
    }
    if (!opts.profile) {
         exitWithError(1, "Missing required option -p <path to BagIt profile>");
    }
    if (opts._.length == 0 || opts._[0] == "") {
        exitWithError(2, "Missing argument path/to/bag.tar");
    } else {
        opts.bag = opts._[0];
    }
    return opts;
}

function printVersion() {
    console.log("dart-validator version 1.0");
    console.log(`Node ${process.platform} ${process.arch} ${process.version}`);
}

function printUsage() {
    console.log(`

dart-validate - DART Bag Validator

  Validate BagIt packages according to a BagIt profile.

  Usage: dart-validate -- -p path/to/bagit/profile.json [-v] path/to/bag.tar

  *** Note the double dashes before the first option in the command line. ***

OPTIONS:

  -p --profile   Required. Path to BagIt profile json file that describes what
                 constitutes a valid bag.
  -d --debug     Optional. If specified, the validator will send verbose output
                 to stdout.
  -v --version   Optional. Prints version and exits.
  -h --help      Optional. Prints this message and exits.

The final command line parameter is the path to the bag, which can be a
directory or a tar file.

EXIT CODES:

  0   Process completed normally. If the --help or --version flag was specified,
      the program printed a message and exited. Otherwise, validation completed
      successfully.
  1   Validation completed but the bag was not valid. See stdout for a list of
      validation errors.
  2   Missing or invalid command line options. Validation not attempted.
  3   Validation was attempted but failed due to an unexpected error such as a
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
