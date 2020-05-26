const { Bagger } = require('../bagit/bagger');
const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const fs = require('fs');
const { Job } = require('../core/job');
const { Util } = require('../core/util');
const { Worker } = require('./worker');

/**
 * BagCreator assembles a bag by copying source files into a
 * bagging directory, writing manifests and tag manifests. This
 * is a thin wrapper around {@link Bagger}. It catches events
 * from the underlying bagger, wraps them in {@link JobStatus}
 * objects, and writes them to STDOUT and STDERR to communicate
 * with the parent process.
 *
 * param {Job} - The job to run. The job object must contain a
 * {@link BagItProfile} and a {@link PackageOperation} to be
 * valid.
 */
class BagCreator extends Worker {

    constructor(job) {
        super('package');
        this.job = job;
    }

    /**
     * This runs the job's package operation, creating the bag. It returns
     * a promise.
     *
     * @returns {Promise}
     */
    run() {
        var creator = this;
        if (!this.job.packageOp.validate()) {
            return new Promise(function(resolve, reject) {
                let errors = Object.values(creator.job.packageOp.errors);
                reject(creator.validationError(errors));
            });
        }
        let dirError = creator.errorOnExistingDir(this.job.packageOp.outputPath)
        if (dirError != null) {
            return new Promise(function(resolve, reject) {
                reject(creator.runtimeError('start', dirError.Message, dirError));
            });
        }

        var bagger = new Bagger(this.job);
        bagger.on('packageStart', function(message) {
            creator.info('start', Constants.OP_IN_PROGRESS, message, 0, false);
        });
        bagger.on('fileAdded', function(bagItFile, percentComplete) {
            creator.info('fileAdded', Constants.OP_IN_PROGRESS, bagItFile.relDestPath, percentComplete, false);
        });
        var promise = new Promise(function(resolve, reject) {
            // Finish never fires. Why? But promise resolves. How?
            bagger.on('finish', function() {
                let result = bagger.job.packageOp.result;
                if (result.errors.length > 0) {
                    creator.completedWithError(result.errors);
                } else {
                    creator.completedSuccess('Bag created');
                }
                resolve(result);
            });
            bagger.on('error', function(err) {
                let result = bagger.job.packageOp.result;
                if (typeof err == 'string') {
                    creator.runtimeError('fileAdded', [err], null);
                } else {
                    creator.runtimeError('fileAdded', null, err);
                }
                reject(result);
            });
        });
        bagger.create();
        return promise;
    }

    /**
     * errorOnExistingDir causes the bag creator to stop with an error
     * if the directory to which we're writing this bag already exists and
     * contains files. Writing a bag into a non-empty directory will usually
     * cause bag validation to fail, as described in
     * https://github.com/APTrust/dart/issues/280
     *
     * @param outputPath {string} - The path to which the bag will be written.
     *
     * @returns {Error}
     */
    errorOnExistingDir(outputPath) {
        if (Util.isNonEmptyDirectory(outputPath)) {
            let msg = Context.y18n.__("Output directory %s already exists and contains files. You must delete it before writing a new bag into it.", outputPath)
            return new Error(msg)
        }
        return null
    }
}

module.exports.BagCreator = BagCreator;
