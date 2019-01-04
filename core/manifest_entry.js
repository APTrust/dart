const { Context } = require('./context');
const dateFormat = require('dateformat');
const { PersistentObject } = require('./persistent_object');
const { Util } = require('./util');
const { ValidationResult } = require('./validation_result');

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
     * @param {string} name - The id (UUID) of the job that packaged the
     * files in this manifest.
     *
     * @param {string} origPath - The original path of the file, before it
     * was bagged or otherwise packaged. This is usually an absolute path
     * from the local filesystem or from an attached network share.
     *
     * @param {string} pathInBag - The relative path of the file within the
     * bag or package. For bagged files, this will begin with 'data/'.
     *
     * @param {string} algorithm - The algorithm used to produce the checksums
     * in this manifest. For example, 'md5', 'sha256', etc.
     *
     * @param {string} digest - The digest/checksum of the file.
     */
    constructor(jobId, origPath, pathInBag, algorithm, digest) {
        super('ManifestEntry');

        /**
          * The id (UUID) of the job that packaged the files in this manifest.
          *
          * @type {string}
          */
        this.jobId = jobId;

        /**
          * The original path of the file, before it was bagged or otherwise
          * packaged. This is usually an absolute path from the local filesystem
          * or from an attached network share.
          *
          * @type {string}
          */
        this.origPath = origPath;

        /**
          * The relative path of the file within the bag or package. For bagged
          * files, this will begin with 'data/'.
          *
          * @type {string}
          */
        this.pathInBag = pathInBag;

        /**
          * The algorithm used to produce the checksums in this manifest.
          * For example, 'md5', 'sha256', etc.
          *
          * @type {string}
          */
        this.algorithm = algorithm;

        /**
          * The digest/checksum of the file.
          *
          * @type {string}
          */
        this.digest = digest;

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
     * validate returns a ValidationResult that describes what if anything
     * is not valid about this object. Classes that derive from PersistentObject
     * must have their own custom implementation of this method.
     *
     * @returns {ValidationResult} - The result of the validation check.
     */
    validate() {
        var result = new ValidationResult();
        if (Util.isEmpty(this.id)) {
            result.errors["id"] = "id cannot be empty";
        }
        if (Util.isEmpty(this.jobId)) {
            result.errors["jobId"] = "jobId cannot be empty";
        }
        if (Util.isEmpty(this.origPath)) {
            result.errors["origPath"] = "origPath cannot be empty";
        }
        if (Util.isEmpty(this.pathInBag)) {
            result.errors["pathInBag"] = "pathInBag cannot be empty";
        }
        if (Util.isEmpty(this.algorithm)) {
            result.errors["algorithm"] = "algorithm cannot be empty";
        }
        if (Util.isEmpty(this.digest)) {
            result.errors["digest"] = "digest cannot be empty";
        }
        return result
    }

    /**
     * find finds the object with the specified id in the datastore
     * and returns it. Returns undefined if the object is not in the datastore.
     *
     * @param {string} id - The id (UUID) of the object you want to find.
     *
     * @returns {Object}
     */
    static find(id) {
        return Context.db('ManifestEntry').get(id);
    }

    /**
     * sort sorts all of the items in the Conf datastore (JSON text file)
     * on the specified property in either 'asc' (ascending) or 'desc' (descending)
     * order. This does not affect the order of the records in the file, but
     * it returns a sorted list of objects.
     *
     * @param {string} property - The property to sort on.
     * @param {string} direction - Sort direction: 'asc' or 'desc'
     *
     * @returns {Object[]}
     */
    static sort(property, direction) {
        return PersistentObject.sort(Context.db('ManifestEntry'), property, direction);
    }

    /**
     * findMatching returns an array of items matching the specified criteria.
     *
     * @see {@link PersistentObject} for examples.
     *
     * @param {string} property - The name of the property to match.
     * @param {string} value - The value of the property to match.
     * @param {Object} opts - Optional additional params.
     * @param {number} opts.limit - Limit to this many results.
     * @param {number} opts.offset - Start results from this offset.
     * @param {string} opts.orderBy - Sort the list on this property.
     * @param {string} opts.sortDirection - Sort the list 'asc' (ascending) or 'desc'. Default is asc.
     *
     * @returns {Object[]}
     */
    static findMatching(property, value, opts) {
        return PersistentObject.findMatching(Context.db('ManifestEntry'), property, value, opts);
    }

    /**
     * firstMatching returns the first item matching the specified criteria,
     * or null if no item matches.
     *
     * @see {@link PersistentObject} for examples.
     *
     * @param {string} property - The name of the property to match.
     * @param {string} value - The value of the property to match.
     * @param {Object} opts - Optional additional params.
     * @param {string} opts.orderBy - Sort the list on this property.
     * @param {string} opts.sortDirection - Sort the list 'asc' (ascending) or 'desc'. Default is asc.
     *
     * @returns {Object}
     */
    static firstMatching(property, value, opts) {
        return PersistentObject.firstMatching(Context.db('ManifestEntry'), property, value, opts);
    }

    /**
     * list returns an array of items matched by the filter function.
     *
     * @see {@link PersistentObject} for examples.
     *
     * @param {filterFunction} filterFunction - A function to filter out items that should not go into the results.
     * @param {Object} opts - Optional additional params.
     * @param {number} opts.limit - Limit to this many results.
     * @param {number} opts.offset - Start results from this offset.
     * @param {string} opts.orderBy - Sort the list on this property.
     * @param {string} opts.sortDirection - Sort the list 'asc' (ascending) or 'desc'. Default is asc.
     *
     * @returns {Object[]}
     */
    static list(filterFunction, opts) {
        return PersistentObject.list(Context.db('ManifestEntry'), filterFunction, opts);
    }

    /**
     * first returns the first item matching that passes the filterFunction.
     * You can combine orderBy, sortDirection, and offset to get the second, third, etc.
     * match for the given criteria, but note that this function only returns a
     * single item at most (or null if there are no matches).
     *
     * @see {@link PersistentObject} for examples.
     *
     * @param {filterFunction} filterFunction - A function to filter out items that should not go into the results.
     * @param {Object} opts - Optional additional params.
     * @param {string} opts.orderBy - Sort the list on this property.
     * @param {string} opts.sortDirection - Sort the list 'asc' (ascending) or 'desc'. Default is asc.
     * @param {number} opts.offset - Skip this many items before choosing a result.
     *
     * @returns {Object}
     */
    static first(filterFunction, opts) {
        return PersistentObject.first(Context.db('ManifestEntry'), filterFunction, opts);
    }
}

module.exports.ManifestEntry = ManifestEntry;
