const minimist = require('minimist')
const { Validator } = require('./validator');

function main() {
    console.log(parseArgs());
    console.log(new Date());
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
    // if (!opts.p) {
    //     exitWithError(1, "Missing required option -p <path to BagIt profile>");
    // }
    return opts;
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

  0   Process completed normally. If the --help flag was specified, the program
      printed a help message and exited. Otherwise, it completed the bag
      validation procesws. (Bag may or may not be valid. Check output.)
  1   Missing or invalid command line options. Validation not attempted.
  2   Validation was attempted but failed due to an unexpected error such as a
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
