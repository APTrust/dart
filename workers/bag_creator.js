const { Bagger } = require('../bagit/bagger');
const { Constants } = require('../core/constants');
const { Job } = require('../core/job');
const { Util } = require('../core/util');
const { Worker } = require('./worker');

class BagCreator extends Worker {

    constructor(job) {
        super('package');
        this.job = job;
    }

    run() {
        if (!this.job.packageOp.validate()) {
            return this.validationError(Object.values(this.job.packageOp.errors));
        }
        var creator = this;
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
                    creator.completedWithError('bagging', result.errors);
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
