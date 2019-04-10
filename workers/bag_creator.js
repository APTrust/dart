const { Bagger } = require('../bagit/bagger');
const { Constants } = require('../core/constants');
const { Job } = require('../core/job');
const { JobError } = require('../core/job_error');
const { Util } = require('../core/util');
const { Worker } = require('./worker');

class BagCreator extends Worker {

    constructor(job) {
        super('Package');
        this.job = job;
    }

    run() {
        if (!this.job.packageOp.validate()) {
            return this.quitWithValidationError();
        }
        var creator = this;
        var bagger = new Bagger(this.job);
        bagger.on('packageStart', function(message) {
            creator.info('packageStart', Constants.OP_IN_PROGRESS, message, false);
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
                if (result.error) {
                    creator.completedWithError('bagging', result.error);
                } else {
                    creator.info('bagging', Constants.OP_SUCCEEDED, 'Bag created');
                }
                resolve(result);
            });
        });
        bagger.create();
        return promise;
    }
}

module.exports.BagCreator = BagCreator;
