const { StorageService } = require('../core/storage_service');

/**
 * This class provides some helper methods for tests that perform
 * uploads.
 */
class UploadTestHelper {

    constructor() {

    }

    /**
     * This returns an StorageService object that points to one of APTrust's
     * test buckets.
     *
     * @returns {StorageService}
     */
    getStorageService() {
        let ss = new StorageService({ name: 'unittest_' + Date.now().toString() });
        ss.protocol = 's3';
        ss.host = 's3.amazonaws.com';
        ss.bucket = 'aptrust.dart.test';
        ss.login = 'env:AWS_ACCESS_KEY_ID';
        ss.password = 'env:AWS_SECRET_ACCESS_KEY';
        return ss;
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
