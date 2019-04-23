const { UploadTarget } = require('../core/upload_target');

/**
 * This class provides some helper methods for tests that perform
 * uploads.
 */
class UploadTestHelper {

    constructor() {

    }

    /**
     * This returns an UploadTarget object that points to one of APTrust's
     * test buckets.
     *
     * @returns {UploadTarget}
     */
    getUploadTarget() {
        let target = new UploadTarget({ name: 'unittest_' + Date.now().toString() });
        target.protocol = 's3';
        target.host = 's3.amazonaws.com';
        target.bucket = 'aptrust.dart.test';
        target.login = 'env:AWS_ACCESS_KEY_ID';
        target.password = 'env:AWS_SECRET_ACCESS_KEY';
        return target;
    }

    /**
     * This returns true if the environment variables AWS_ACCESS_KEY_ID
     * and AWS_SECRET_ACCESS_KEY appear to be set.
     *
     * @returns {boolean}
     */
    envHasS3Credentials() {
        return (typeof process.env.AWS_ACCESS_KEY_ID != 'undefined' && process.env.AWS_SECRET_ACCESS_KEY != 'undefined');
    }

}

module.exports.UploadTestHelper = UploadTestHelper;
