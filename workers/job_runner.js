const { BagCreator } = require('./bag_creator');
const { Job } = require('../core/job');

class JobRunner {
    constructor(pathToFile) {
        this.job = Job.inflateFromFile(pathToFile);
    }
    run() {
        // Stub
        let bagCreator = new BagCreator(this.job);

        bagCreator.validateParams();

        // TODO: Catch the child process's stdout, stderr, and exit code.
        // Returns a promise.
        return bagCreator.run();
    }
}

module.exports.JobRunner = JobRunner;
