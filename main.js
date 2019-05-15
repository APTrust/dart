const { Constants } = require('./core/constants');
const { Context } = require('./core/context');
const { JobRunner } = require('./workers/job_runner');
const minimist = require('minimist');
const process = require('process');

// Electron wants these vars to be global, so we defined them here.
// They will be assigned only if we're running in GUI mode.
let win;
let app;

// This runs the app in either CLI or GUI mode.
// We don't load the heavyweight Electron requirements unless
// we're running in GUI mode.
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
        // GUI mode. Hoist win and app to global namespace.
        let ui = require('./ui/main');
        win = ui.win;
        app = ui.app;
    }
}

// Run in command-line mode.
async function runWithoutUI(opts) {
    Context.logger.info(`Starting DART command-line mode pid: ${process.pid}, job: ${opts.job}`);
    let jobRunner = new JobRunner(opts.job, opts.deleteJobFile);
    let exitCode = await jobRunner.run();
    Context.logger.info(`Finished DART command-line mode pid: ${process.pid}, job: ${opts.job}. Exit Code: ${exitCode}`);
    process.exit(exitCode);
    //return exitCode;
}

// And away we go...
run();
