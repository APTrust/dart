const { Context } = require('./context');
const { PersistentObject } = require('./persistent_object');
const { Util } = require('./util');

/**
 * DartProcess contains information about processes spawned from
 * the main UI to run jobs, which may include packaging, validatating,
 * and/or uploading files.
 */
class DartProcess {
    /**
     * Creates a new DartProcess
     *
     * @param {string} name - The name of the job. This is usually the
     * bag or package name, though jobs that don't include a packaging
     * step may get a generic name like "Validate xxx" or "Upload xxx".
     *
     * @param {string} jobId - The id (UUID) of the job that the process
     * is running.
     *
     * @param {ChildProcess} processId - The system process id.
     */
    constructor(name, jobId, process) {
        /**
         * A UUID that uniquely identifies this DartProcess.
         *
         * @type {string}
         */
        this.id = Util.uuid4();
        /**
         * Name is the name of the job. This is usually the
         * bag or package name, though jobs that don't include a packaging
         * step may get a generic name like "Validate xxx" or "Upload xxx".
         *
         * @type {string}
         */
        this.name = name;
        /**
         * The id (UUID) of the job that the process is running.
         *
         * @type {string}
         */
        this.jobId = jobId;
        /**
         * The child process.
         *
         * @type {number}
         */
        this.process = process;
        /**
         * The date/time at which the job was started. This timestamp
         * is in ISO datetime format.
         *
         * @type {string}
         */
        this.startedAt = new Date().toISOString();
    }

}

module.exports.DartProcess = DartProcess;
