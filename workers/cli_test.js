const { fork } = require('child_process');
const { Job } = require('../core/job');
const { JobParams } = require('../core/job_params');
const { Workflow } = require('../core/workflow');

// TODO: Fixtures for the a runnable job and runnable workflow

// TODO: Move the Job fork code to a Util class that ensures
// the spawned job's DartProcess is added to Context.childProcesses

// // Need to change npm command outside of dev env.
// let modulePath = path.join(__dirname, '..', '..', 'main.js');
// this.childProcess = fork(
//     modulePath,
//     ['--job', tmpFile, '--deleteJobFile']
// );


test('...', () => {
    expect(1).toEqual(1);
});

// test('Run job by UUID', () => {

// });

// test('Run job from Job JSON file', () => {

// });

// test('Run job from JobParams JSON file', () => {

// });

// test('Run job from Job JSON passed through STDIN', () => {

// });

// test('Run job from JobParams JSON passed through STDIN', () => {

// });
