const { Bagger } = require('../bagit/bagger');
const { Constants } = require('../core/constants');
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
        var bagger = new Bagger(this.job);
        bagger.on('packageStart', function(message) {
            creator.info('start', Constants.OP_IN_PROGRESS, message, false);
        });
        bagger.on('error', function(err) {
            if (typeof err == 'string') {
                creator.runtimeError('fileAdded', [err], null);
            } else {
                creator.runtimeError('fileAdded', null, err);
            }
        });
        bagger.on('fileAdded', function(bagItFile) {
            creator.info('fileAdded', Constants.OP_IN_PROGRESS, bagItFile.relDestPath, false);
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
        });
        bagger.create();
        return promise;
    }
}

module.exports.BagCreator = BagCreator;
