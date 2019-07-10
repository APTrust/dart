const { Context } = require('../core/context');
const fs = require('fs');
const { Job } = require('../core/job');
const { JobParams } = require('../core/job_params');
const { Util } = require('../core/util');

/**
 * JobLoader is a helper class for loading a {@link Job} to be run from
 * the command line. The {@link JobRunner} class takes a single parameter,
 * which is a {@link Job} object. That Job object may be specified on the
 * command line in any of the following ways:
 *
 * * In opts.job as a Job UUID
 * * In opts.job as a path to a JSON file containing a {@link Job} object
 * * In opts.job as a path to a JSON file containing a {@link JobParams} object.
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
 *
 * Although both params listed below are optional, you must specify at
 * least one of the two. If you specify both, json takes precedence
 * over opts.job.
 *
 * @param {object} opts - An object, typically the command line options.
 *
 * @param {string} [opts.job] - The path to a file containing the {@link
 * Job} in JSON format, or a job UUID. If this is a UUID, the loader will
 * load the job from the database. If it's any other string, the loader
 * will attempt to load it from a JSON file.
 *
 * @param {string|Buffer} [json] - A string or buffer containing JSON
 * data. Typically, this is read from STDIN when DART is run from the
 * command line.
 */
class JobLoader {

    constructor(opts, json = null) {
        this.opts = opts || { job: null };
        if (json) {
            this.json = json.toString();
        } else {
            this.json = null;
        }
    }

    /**
     * Loads a job. If json is not empty, this tries to parse the
     * data as {@link Job} JSON or as {@link JobParams} JSON. Otherwise
     * if opts.job is a UUID, it tries to load the job with that UUID from
     * the Jobs database. If opts.job is any string other than a UUID, this
     * tries to read the file at the path specified by opts.job and parse
     * it as {@link Job} JSON.
     *
     * This will throw an error if it encounters unparsable JSON, is asked
     * to read a non-existent or unopenable file, or cannot find a {@link
     * Job} with the specified UUID.
     *
     * @returns {Job}
     *
     */
    loadJob () {
        if (!this.json && !this.opts.job) {
            // TODO: Test this.
            throw new Error(Context.y18n.__('You must specify either %s or %s',
                                            'opts.job', 'json'));
        }
        if (this.json && this.json.length > 0) {
            return this._loadFromJson();
        }
        if (Util.looksLikeUUID(this.opts.job)) {
            return this._loadJobById();
        } else if (this.opts.job) {
            // TODO: Load as vanilla object, then convert to
            // either Job or JobParams.
            // TODO: Add test to ensure this loads either type
            // of JSON.
            return this._loadObjectFromFile();
        }
    }

    /**
     * This loads the Job with the UUID specified in this.opts.job.
     * Throws an error if job is not found. This is called only if
     * this.opts.job is a string that looks like a UUID.
     *
     * @private
     * @returns {Job}
     */
    _loadJobById() {
        let job = Job.find(this.opts.job);
        if (!job) {
            throw new Error(Context.y18n.__('Cannot find job with id %s', this.opts.job));
        }
        return job;
    }

    /**
     * Loads a {@link Job} from the file path specified in this.opts.job.
     * This will throw an error if the file does not exist, cannot be read,
     * or cannot be parsed as JSON. The JSON in the file can be either a
     * {@link Job} or a {@link JobParams} object.
     *
     * @private
     * @returns {Job}
     */
    _loadObjectFromFile() {
        if (!fs.existsSync(this.opts.job)) {
            throw new Error(Context.y18n.__('Job file does not exist at %s', this.opts.job));
        }
        try {
            this.json = fs.readFileSync(this.opts.job);
        } catch (ex) {
            throw new Error(Context.y18n.__('Error loading job file at %s: %s',
                                            this.opts.job, ex.message));
        }
        return this._loadFromJson();
    }

    /**
     * Loads a Job from the JSON string that passed through STDIN or
     * read from a file. That string may be a JSON-serialized {@link Job}
     * or a JSON-serialized {@link JobParams} object. In either case,
     * this returns a {@link Job} object.
     *
     * This will throw an error if the JSON is invalid or does not appear
     * to represent either a {@link Job} or a {@link JobParams} object.
     *
     * @private
     * @returns {Job}
     */
    _loadFromJson() {
        let data = this._parseJson();
        if (this.looksLikeJob(data)) {
            return Job.inflateFrom(data);
        } else if (this.looksLikeJobParams(data)) {
            return this._loadFromJobParams(data);
        } else {
            throw new Error(Context.y18n.__("JSON data does not look like a job or a workflow."));
        }
    }

    /**
     * Converts a generic hash object that looks like a {@link JobParams}
     * object into a {@link Job}.
     *
     * @private
     * @returns {Job}
     */
    _loadFromJobParams(data) {
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

    /**
     * This parses the string or Buffer in this.json into a generic
     * JavaScript object.
     *
     * @private
     * @returns {object}
     */
    _parseJson() {
        try {
            return JSON.parse(this.json);
        } catch (ex) {
            let source = this.opts.job || 'STDIN'
            throw new Error(Context.y18n.__("Error parsing JSON from %s: %s",
                                            source, ex.stack));
        }
    }

    /**
     * Returns true if the generic JavaScript object in param data looks
     * like it may be a {@link Job} object.
     *
     * @param {object} data - Any generic JavaScript object.
     *
     * @returns {boolean}
     *
     */
    looksLikeJob(data) {
        return 'packageOp' in data || 'uploadOps' in data;
    }

    /**
     * Returns true if the generic JavaScript object in param data looks
     * like it may be a {@link JobParams} object.
     *
     * @param {object} data - Any generic JavaScript object.
     *
     * @returns {boolean}
     *
     */
    looksLikeJobParams(data) {
        return 'workflowName' in data;
    }

}

module.exports.JobLoader = JobLoader;
