const { Constants } = require('./core/constants');
const { Context } = require('./core/context');
const fs = require('fs');
const { JobLoader } = require('./util/job_loader');
const { JobRunner } = require('./workers/job_runner');
const minimist = require('minimist');
const process = require('process');
const osLocale = require('os-locale');

// Electron wants these vars to be global, so we defined them here.
// They will be assigned only if we're running in GUI mode.
let win;
let app;

// This runs the app in either CLI or GUI mode.
// We don't load the heavyweight Electron requirements unless
// we're running in GUI mode.
async function run() {
    process.on('uncaughtException', function (error) {
        console.error(error);
        Context.logger.error(error);
    });
    let opts = minimist(process.argv.slice(2), {
        string: ['j', 'job'],
        boolean: ['d', 'debug', 'h', 'help', 'v', 'version',
                  's', 'stdin'],
        default: { d: false, debug: false,
                   h: false, help: false,
                   s: false, stdin: false,
                   v: false, version: false},
        alias: { D: ['debug'], h: ['help'], j: ['job'],
                 s: ['stdin'], v: ['version'],
                 w: ['workflow']}
    });
    if (opts.job || opts.stdin) {
        process.DART_MODE = 'cli';
        makey18nWriteSafe();
        return runWithoutUI(opts);
    } else {
        // GUI mode. Hoist win and app to global namespace.
        process.DART_MODE = 'gui';
        makey18nWriteSafe();
        let ui = require('./ui/main');
        win = ui.win;
        app = ui.app;
    }
    console.log(`DART is logging to ${Context.config.logDir}`);
    Context.logger.info(`DART started (${process.DART_MODE} mode)`);
}

// Run in command-line mode.
async function runWithoutUI(opts) {
    Context.logger.info(`Starting DART command-line mode pid: ${process.pid}, job: ${opts.job}`);
    console.log(opts)
    if (opts.fromgui) {
        console.log("main.js: called from gui")
        Context.logger.info("Job was called from DART GUI");
        Context.calledFromDartGui = true
    }
    Context.logger.info(Context.dartVersion());
    let stdinData = '';
	// https://github.com/APTrust/dart/issues/504
	// Try reading stdin both ways.
    if (opts.stdin) {
		try {
			stdinData = fs.readFileSync(0, 'utf-8');
		} catch (ex) {
			stdinData = await readStdin();
		}
    }
    Context.logger.info('STDIN -> ', stdinData);
	try {
		let job = new JobLoader(opts, stdinData).loadJob();
		let jobRunner = new JobRunner(job);
		let exitCode = await jobRunner.run();
        Context.logger.info("+++++++" + Context.calledFromDartGui)
		Context.logger.info(`Finished DART command-line mode pid: ${process.pid}, job: ${opts.job}. Exit Code: ${exitCode}`);
		process.exit(exitCode);
	} catch (err) {
		Context.logger.error(`Finished DART command-line mode pid ${process.pid} with error ${err}`);
		console.error(err);
		process.exit(Constants.EXIT_RUNTIME_ERROR);
	}
}

// This prevents a bug where y18n may wipe out locale files.
// Don't let y18n write locale files in cli mode because it
// can corrupt files. Don't let it write outside of dev mode
// because it probably cannot write back into the packaged ASAR file.
// We can't call this until after process.DART_MODE is set.
//
// See https://trello.com/c/ELW94mfF for more info.
function makey18nWriteSafe() {
    Context.y18n.updateFiles = (process.DART_MODE == 'gui' && Context.isElectronDevMode());
    Context.logger.info(Context.dartVersion());
    Context.logger.info("Y18 updateFiles = " + Context.y18n.updateFiles);
    if (Context.y18n.getLocale() != osLocale.sync()) {
        Context.logger.info(`DART could not find a suitable translation file for locale ${osLocale.sync()} so it's currently using ${Context.y18n.getLocale()}`)
    }
}

// The canonical way to read from STDIN in Node is:
//
//    stdinData = fs.readFileSync(0, 'utf-8');
//
// However, this seems to break and then get re-fixed in various
// node versions. Run variations on this search in your favorite
// search engine to see a few examples. Follow the links to see
// even more examples:
//
//    node stdin eagain
//
// Since the EAGAIN error started appearing again in Node 13.7,
// we implement our own async function to read from STDIN.
// This is used as a fallback, in case the standard method fails.
// With this in place, all tests pass under Node 13.7.
function readStdin() {
    let promise = new Promise((resolve, reject) => {
        var chunks = [];
        process.stdin
            .on("data", function(chunk) {
                chunks.push(chunk);
            })
            .on("end", function() {
                resolve(chunks.join(""));
            })
            .setEncoding("utf8");
    });
	promise.catch((err) => {
		console.log(err)
		process.exit(1)
	});
	return promise
}

// And away we go...
(async function () {
    await run();
})();
