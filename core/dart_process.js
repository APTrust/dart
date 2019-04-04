const { Context } = require('./context');
const { PersistentObject } = require('./persistent_object');
const { Util } = require('./util');

/**
 * DartProcess contains information about processes spawned from
 * the main UI to run jobs, which may include packaging, validatating,
 * and/or uploading files.
 */
class DartProcess extends PersistentObject {
    /**
     * Creates a new DartProcess
     *
     * @param {string} name - The name of the job. This is usually the
     * bag or package name, though jobs that don't include a packaging
     * step may get a generic name like "Validate xxx" or "Upload xxx".
     *
     * @param {string} pathToJobFile - The path the JSON file that describes
     * what the job is doing. The JSON file contain a JSON-serialized
     * {@link Job} object.
     *
     * @param {number} processId - The system process id.
     */
    constructor(name, pathToJobFile, processId) {
        super({});
        /**
         * Name is the name of the job. This is usually the
         * bag or package name, though jobs that don't include a packaging
         * step may get a generic name like "Validate xxx" or "Upload xxx".
         *
         * @type {string}
         */
        this.name = name;
        /**
         * The path the JSON file that describes what the job is doing.
         * The JSON file contain a JSON-serialized {@link Job} object.
         * Job files are temporary, and are deleted when the job completes.
         *
         * @type {string}
         */
        this.pathToJobFile = pathToJobFile;
        /**
         * This is the system's numeric process id for the child process.
         *
         * @type {number}
         */
        this.processId = processId;
        /**
         * The date/time at which the job was started. This timestamp
         * is in ISO datetime format.
         *
         * @type {string}
         */
        this.startedAt = new Date().toISOString();
        /**
         * The exit code of the process that ran this job.
         * A null value indicates the process has not or did not
         * complete. Zero indicates success, while non-zero numbers
         * indicate a problem.
         *
         * @type {number|null}
         */
        this.exitCode = null;
        /**
         * This string contains captured final output, which not the
         * complete output of the process, but some relevant informat
         * captured from stdout or stderr to say either that the process
         * completed successfully, or if not, what specific error
         * caused it to fail.
         *
         * @type {string}
         */
        this.capturedOutput = "";
    }
}

// Copy static methods from base
Object.assign(DartProcess, PersistentObject);

module.exports.DartProcess = DartProcess;
