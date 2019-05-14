const { Constants } = require('./core/constants');
const { JobRunner } = require('./workers/job_runner');
const minimist = require('minimist');
const process = require('process');

// Run a job without the UI.

// TODO: De-dupe from main.js.

function run() {
    let opts = minimist(process.argv.slice(2), {
        string: ['j', 'job'],
        boolean: ['D', 'debug', 'h', 'help', 'v', 'version',
                  'd', 'deleteJobFile'],
        default: { D: false, debug: false, h: false, help: false,
                   v: false, version:false, d: false, deleteJobFile: false},
        alias: { D: ['debug'], v: ['version'], h: ['help'], j: ['job'],
                 d: ['deleteJobFile']}
    });
    if (!opts.job) {
        console.error('Param --job is required.');
        return Constants.EXIT_INVALID_PARAMS;
    } else {
        return runWithoutUI(opts);
    }
}

async function runWithoutUI(opts) {
    console.log(`DART command-line mode pid: ${process.pid}, job: ${opts.job}`);
    let jobRunner = new JobRunner(opts.job, opts.deleteJobFile);
    let exitCode = await jobRunner.run();
    //process.exit(exitCode);
    return exitCode;
}

if (typeof module != 'undefined' && !module.parent) {
    // this is the main module
    run();
} else {
    // we were required from somewhere else
}
