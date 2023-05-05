const dateFormat = require('dateformat');
const { PersistentObject } = require('./persistent_object');

/**
 * ManifestEntry objects record info about files that were bagged or
 * otherwise packaged in a DART Job. DART records ManifestEntry records
 * for payload files, but not for tag files.
 *
 * Note that if a job was run several times, a file can have several manifest
 * entries, each with a timestamp indicating when it was packaged.
 *
 */
class ManifestEntry extends PersistentObject {
    /**
     * Creates a new ManifestEntry
     *
     * @param {object} opts - Object containing properties to set.
     *
     * @param {string} opts.id - A UUID in hex-string format. This is
     * the object's unique identifier.
     *
     * @param {boolean} opts.userCanDelete - Indicates whether user is
     * allowed to delete this record.
     *
     * @param {string} opts.jobId - The id (UUID) of the job that packaged the
     * files in this manifest.
     *
     * @param {string} opts.origPath - The original path of the file, before it
     * was bagged or otherwise packaged. This is usually an absolute path
     * from the local filesystem or from an attached network share.
     *
     * @param {string} opts.pathInBag - The relative path of the file within the
     * bag or package. For bagged files, this will begin with 'data/'.
     *
     * @param {string} opts.algorithm - The algorithm used to produce the checksums
     * in this manifest. For example, 'md5', 'sha256', etc.
     *
     * @param {string} opts.digest - The digest/checksum of the file.
     */
    constructor(opts = {}) {
        opts.required = ['jobId', 'origPath', 'pathInBag', 'algorithm', 'digest'];
        super(opts);

        /**
          * The id (UUID) of the job that packaged the files in this manifest.
          *
          * @type {string}
          */
        this.jobId = opts.jobId || null;

        /**
          * The original path of the file, before it was bagged or otherwise
          * packaged. This is usually an absolute path from the local filesystem
          * or from an attached network share.
          *
          * @type {string}
          */
        this.origPath = opts.origPath || "";

        /**
          * The relative path of the file within the bag or package. For bagged
          * files, this will begin with 'data/'.
          *
          * @type {string}
          */
        this.pathInBag = opts.pathInBag || "";

        /**
          * The algorithm used to produce the checksums in this manifest.
          * For example, 'md5', 'sha256', etc.
          *
          * @type {string}
          */
        this.algorithm = opts.algorithm || "";

        /**
          * The digest/checksum of the file.
          *
          * @type {string}
          */
        this.digest = opts.digest || "";

        /**
          * The date and time this manifest was created, in ISO datetime
          * format. If a job was run multiple times, it can have multiple
          * manifests, each with its own timestamp. The timestamp value
          * shows when the job finished packaging the files. The packaging
          * process would have started before this timestamp, and if the job
          * included an upload step, the job itself would have completed
          * after this timestamp.
          *
          * @type {string}
          */
        this.timestamp = dateFormat(Date.now(), 'isoUtcDateTime');
    }

    /**
     * validate returns true or false, indicating whether this object
     * contains complete and valid data. If it returns false, check
     * the errors property for specific errors.
     *
     * @returns {boolean}
     */
    validate() {
        return super.validate();
    }

}

Object.assign(ManifestEntry, PersistentObject);

module.exports.ManifestEntry = ManifestEntry;
