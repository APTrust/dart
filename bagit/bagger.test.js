const { Bagger } = require('./bagger');
const { BagItProfile } = require('./bagit_profile');
const { Job } = require('../core/job');
const os = require('os');
const { PackagingOperation } = require('../core/packaging_operation');
const path = require('path');

function getJob() {
    var profilesDir = path.join(__dirname, '..', 'test', 'profiles');
    var job = new Job();
    var tmpFile = path.join(os.tmpdir(), 'TestBag.tar');
    job.packagingOperation = new PackagingOperation('TestBag', tmpFile, '.tar');
    job.packagingOperation.sourceFiles.push(profilesDir);
    job.bagItProfile = BagItProfile.load(path.join(profilesDir, 'aptrust_bagit_profile_2.2.json'));
    return job;
}

test('ha!', done => {
    let bagger = new Bagger(getJob());
    var succeeded = false;
    // done();
    bagger.on('finish', function() {
        expect(bagger.job.packagingOperation.result.error).toBeNull();
        expect(succeeded).toEqual(true);
        done();
    });

    bagger.create();
});
