const { BagItProfile } = require('../bagit/bagit_profile');
const { BagValidator } = require('./bag_validator');
const CLI = require('./cli_constants');
var dateFormat = require('dateformat');
const { manual } = require('./manual');
const minimist = require('minimist')
const { ProfileValidator } = require('./profile_validator');


async function main() {
    process.exitCode = CLI.EXIT_SUCCESS;
    let opts = parseArgs();
    let task;
    if (opts.command == "validate-bag") {
        task = new BagValidator(opts);
    } else if (opts.command == "validate-profile") {
        task = new ProfileValidator(opts);
    }
    try {
        task.run();
    } catch (ex) {
        console.log(ex)
    } finally {
        process.exit = task.exitCode;
    }
}

// TODO: Move this to seperate file.
function parseArgs() {
    let opts = minimist(process.argv.slice(2), {
        string: ['bag', 'profile', 'job', 'sources', 'output'],
        boolean: ['d', 'debug', 'h', 'help'],
        default: { d: false, debug: false, h: false, help: false},
        alias: { d: ['debug'], p: ['profile'], v: ['version'], h: ['help'],
                 c: ['command'], s: ['sources'], o: ['output']}
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
        exitWithError(CLI.EXIT_INVALID_PARAMS, "Missing required option [-c | -command] <${VALID_COMMANDS.join('|')}>.");
    }
    if (!CLI.VALID_COMMANDS.includes(opts.command)) {
        exitWithError(CLI.EXIT_INVALID_PARAMS, "Invalid command ${opts.command}");
    }
    if (opts.c == "validate-bag") {
        opts.bag = opts._[0];
    } else if (opts.c == "validate-profile") {
        opts.profile = opts._[0];
    } else if (opts.c == "run-job") {
        opts.job = opts._[0];
    }
    return opts;
}

function printVersion() {
    console.log("dart-validator version 1.0");
    console.log(`Node ${process.platform} ${process.arch} ${process.version}`);
}

function printUsage() {
    console.log(manual);
}

function exitWithError(code, message) {
    console.error(message);
    process.exit(code);
}

if (!module.parent) {
    main();
}
