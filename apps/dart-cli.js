const _throwaway = require('./nexe_force_load');
const { BagItProfile } = require('../bagit/bagit_profile');
const { BagCreator } = require('./bag_creator');
const { BagValidator } = require('./bag_validator');
const CLI = require('./cli_constants');
const { Context } = require('../core/context');
const { manual } = require('./manual');
const Migrations = require('../migrations/migrations');
const minimist = require('minimist')
const { ProfileValidator } = require('./profile_validator');

async function main() {
    Migrations.runAll();
    process.exitCode = CLI.EXIT_SUCCESS;
    let opts = parseArgs();
    let task;
    switch (opts.command) {
      case "validate-bag":
        task = new BagValidator(opts);
        break;
      case "validate-profile":
        task = new ProfileValidator(opts);
        break;
      case "create-bag":
        task = new BagCreator(opts);
        break;
      case "run-job":
        break;
      default:
        invalidParams(`Invalid command '${opts.command}'. ${CLI.VALID_COMMANDS.join('|')}`);
    }
    try {
        await task.run();
    } catch (ex) {
        console.log(ex)
    }
    return(task.exitCode);
}

// TODO: Move this to seperate file.
function parseArgs() {
    let opts = minimist(process.argv.slice(2), {
        string: ['bag', 'command', 'profile', 'job', 'source', 'dest', 'output', 'tag'],
        boolean: ['d', 'debug', 'h', 'help'],
        default: { D: false, debug: false, h: false, help: false},
        alias: { D: ['debug'], p: ['profile'], v: ['version'], h: ['help'],
                 c: ['command'], s: ['source'], o: ['output'], t: ['tag'],
                 d: ['dest']}
    });
    //console.log(opts);
    if (opts.help) {
        printUsage();
        process.exit(0);
    }
    if (opts.version) {
        printVersion();
        process.exit(0);
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

function invalidParams(message) {
    console.error(message);
    process.exit(CLI.EXIT_INVALID_PARAMS);
}

if (!module.parent) {
    main();
}
