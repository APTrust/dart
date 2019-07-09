const { Context } = require('../core/context');
const { Job } = require('../core/job');
const { JobParams } = require('../core/job_params');
const { Util } = require('../core/util');

/**
 * JobLoader is a helper class for loading a {@link Job} to be run from
 * the command line. The {@link JobRunner} class takes a single parameter,
 * which is a {@link Job} object. That Job object may be specified on the
 * command line in any of the following ways:
 *
 * * As a Job UUID
 * * As a path to a JSON file containing a {@link Job} object
 * * As a path to a JSON file containing a {@link JobParams} object.
 * * As raw JSON passed through STDIN representing a {@link Job} object
 * * As raw JSON passed through STDIN representing a {@link JobParams} object
 *
 * The JobLoader will figure out what was specified, and will return the
 * appropriate Job object.
 *
 * Note that valid {@link Job} objects are complete and ready to run, while
 * {@link JobParams} objects refer to a {@link Workflow} and specify which
 * files should be passed through that Workflow and what tag values or
 * metadata values should be applied. The JobLoader will convert JobParams
 * objects to full-fledged Job objects.
 */
class JobLoader {

    constructor(opts, stdinData) {
        this.opts = opts;
        if (stdinData) {
            this.stdinData = stdinData.toString();
        } else {
            this.stdinData = null;
        }
    }

    loadJob () {
        if (this.stdinData.length > 0) {
            return this.loadFromStdin();
        }
        if (Util.looksLikeUUID(this.opts.job)) {
            return Job.find(this.opts.job);
        } else if (this.opts.job) {
            return Job.inflateFromFile(this.opts.job);
        }
    }

    loadFromStdin() {
        let data = this.parseStdin();
        if (this.looksLikeJob(data)) {
            return Job.inflateFrom(data);
        } else if (this.looksLikeJobParams(data)) {
            return this.loadFromJobParams(data);
        } else {
            throw new Error(Context.y18n.__("JSON data passed to STDIN does not look like a job or a workflow."));
        }
    }

    loadFromJobParams(data) {
        let jobParams = new JobParams(data);
        let job = jobParams.toJob();
        if (!job) {
            let msg = Context.y18n.__('Error creating job.');
            for(let [key, value] of Object.entries(jobParams.errors)) {
                msg += `\n${key}: ${value}`;
            }
            throw new Error(msg);
        }
        return job;
    }

    parseStdin() {
        try {
            return JSON.parse(this.stdinData);
        } catch (ex) {
            throw new Error(Context.y18n.__(
                "Error parsing JSON from STDIN: %s",
                ex.stack));
        }
    }

    looksLikeJob(data) {
        return 'packageOp' in data || 'uploadOps' in data;
    }

    looksLikeJobParams(data) {
        return 'workflowName' in data;
    }

}

module.exports.JobLoader = JobLoader;
