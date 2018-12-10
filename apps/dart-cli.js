const { BagItProfile } = require('../bagit/bagit_profile');
const { BagValidator } = require('./bag_validator');
const CLI = require('./cli_constants');
var dateFormat = require('dateformat');
const { manual } = require('./manual');
const minimist = require('minimist')


async function main() {
    process.exitCode = CLI.EXIT_SUCCESS;
    let opts = parseArgs();
    let task;
    if (opts.command == "validate-bag") {
        // let validator = await validateBag(opts);
        // if (validator.errors.length == 0) {
        //     console.log("Bag is valid")
        // } else {
        //     console.log("Bag has the following errors:");
        //     for (let e of validator.errors) {
        //         console.log(`    ${e}`);
        //         process.exitCode = EXIT_COMPLETED_WITH_ERRORS;
        //     }
        // }
        task = new BagValidator(opts);
    } else if (opts.command == "validate-profile") {
        validateProfile(opts);
    }
    try {
        task.run();
    } catch (ex) {
        console.log(ex)
    } finally {
        process.exit = task.exitCode;
    }
}

// function validateBag(opts) {
//     return new Promise(function(resolve, reject) {
//         let profile = BagItProfile.load(opts.profile);
//         let validator = new Validator(opts.bag, profile);
//         validator.on('error', function(err) {
//             resolve(validator);
//         });
//         validator.on('end', function() {
//             resolve(validator);
//         });
//         if (opts.debug) {
//             validator.on('task', function(taskDesc) {
//                 let ts = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss.l");
//                 console.log(`  [debug] [${ts}] ${taskDesc.op} ${taskDesc.path}`);
//             });
//         }
//         validator.validate();
//     });
// }

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
        process.exitCode = CLI.EXIT_COMPLETED_WITH_ERRORS;
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
    if (opts.command == "validate-bag" && !opts.profile) {
         exitWithError(CLI.EXIT_INVALID_PARAMS, "Missing required option [-p | --profile] <path to BagIt profile>");
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
        exitWithError(CLI.EXIT_INVALID_PARAMS, `Missing final argument ${missingParam}\n${sample}`);
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
    console.log(manual);
}

function exitWithError(code, message) {
    console.error(message);
    process.exit(code);
}

if (!module.parent) {
    main();
}
