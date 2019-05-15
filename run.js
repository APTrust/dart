const { Constants } = require('./core/constants');
const { Context } = require('./core/context');
const { JobRunner } = require('./workers/job_runner');
const minimist = require('minimist');
const process = require('process');

// Run a job without the UI.

// TODO: De-dupe from main.js.

let win;
let app;

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
    if (opts.job) {
        return runWithoutUI(opts);
    } else {
        let ui = require('./ui/main');
        win = ui.win;
        app = ui.app;
    }
}

async function runWithoutUI(opts) {
    Context.logger.info(`Starting DART command-line mode pid: ${process.pid}, job: ${opts.job}`);
    let jobRunner = new JobRunner(opts.job, opts.deleteJobFile);
    let exitCode = await jobRunner.run();
    Context.logger.info(`Finished DART command-line mode pid: ${process.pid}, job: ${opts.job}. Exit Code: ${exitCode}`);
    process.exit(exitCode);
    //return exitCode;
}

run();

// if (typeof module != 'undefined' && !module.parent) {
//     // this is the main module
//     run();
// } else {
//     // we were required from somewhere else
// }
