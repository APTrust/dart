const { Constants } = require('../core/constants');

/**
 * BagItFile contains metadata about a file that the bagger
 * will be packaging into a bag. This metadata includes the
 * file's absolute source path, its relative path within the
 * bag, its size and checksums, and a few other bits of data.
 *
 * If the file happens to be a tag file, manifest, or tag manifest,
 * it may have additional data stored in the keyValueCollection
 * property. That data may be written into a text file during the
 * bagging process.
 *
 * @param {string} absSourcePath - The absolute source path of the
 * file. The bagger will copy the file from this path into
 * relDestPath inside the bag.
 *
 * @param {string} relDestPath - The relative path at which this
 * file should reside within the bag. For manifests, relDestPath
 * will be inside the top-level directory of the bag. For example,
 * at 'manifest-sha256.txt'. For payload files, relDestPath will
 * have the prefix 'data/'. For example, 'data/images/photo.jpg.'
 * Some bagging profiles permit tag files in subdirectories outside
 * the payload directory; hence 'dpn-data/dpn-tags.txt' may be a
 * valid relDestPath. BagItFile infers the type of the file from
 * the relDestPath param.
 *
 * @param {object} stats - A subset of stats gathered from Node's
 * fs.Stat() function. The BagItFile object keeps only a handful of
 * properties from fs.Stat(). This param can be a Node.js fs.Stats
 * object or a {@link FileStat} object.
 *
 */
class BagItFile {

    constructor(absSourcePath, relDestPath, stats) {
        /**
          * absSourcePath is the absolute source path to this file.
          * The bagger will copy the file from this path into
          * relDestPath inside the bag.
          *
          * @type {string}
          */
        this.absSourcePath = absSourcePath;
        /**
          * The relative path at which this
          * file should reside within the bag. For manifests, relDestPath
          * will be inside the top-level directory of the bag. For example,
          * at 'manifest-sha256.txt'. For payload files, relDestPath will
          * have the prefix 'data/'. For example, 'data/images/photo.jpg.'
          * Some bagging profiles permit tag files in subdirectories outside
          * the payload directory; hence 'dpn-data/dpn-tags.txt' may be a
          * valid relDestPath. BagItFile infers the type of the file from
          * the relDestPath param.
          *
          * @type {string}
          */
        this.relDestPath = relDestPath;
        /**
          * size is the size, in bytes, of the file.
          *
          * @type {number}
          */
        this.size = stats.size;
        /**
          * uid is the id of the user who owns the file.
          *
          * @type {number}
          */
        this.uid = stats.uid;
        /**
          * gid is the id of the group that owns this file.
          *
          * @type {number}
          */
        this.gid = stats.gid;
        /**
          * mtime is the time this file was last modified.
          *
          * @type {Date}
          */
        this.mtime = stats.mtime;
        /**
          * isFile will be true if this is a regular file.
          * It will be false if this is a directory, socket, or link.
          *
          * @type {boolean}
          */
        this.isFile = stats.isFile();
        /**
          * isDirectory will be true if this is a directory.
          *
          * @type {boolean}
          */
        this.isDirectory = stats.isDirectory();
        /**
          * fileType is one of 'manifest', 'tagmanifest', 'payload', or 'tagfile',
          * based on relDestPath. File types are defined in Constants.FILE_TYPES.
          *
          * @type {string}
          */
        this.fileType = BagItFile.getFileType(relDestPath);
        /**
          * checksums contains a hash of fixity values we calculate on
          * the file's contents.
          *
          * key = algorithm name ('md5', 'sha256', etc.)
          * value = digest
          *
          * @type {Object<string, string>}
          */
        this.checksums = {};
        /**
          * keyValueCollection is used by the validator to store
          * the parsed contents of tag files and manifests.
          *
          * @type {KeyValueCollection}
          */
        this.keyValueCollection = null;
    }

    /**
     * Returns the manifest entry for the specified algorithm,
     * or throws an exception if the checksum for that algorithm
     * is not present. The format of the returned string is suitable
     * for printing into a payload manifest or tag manifest.
     *
     * @param {string} algorithm - The algorithm of the digest to retrieve.
     *
     * @returns {string} - A manifest entry for this file, in the format
     * <digest> <relDestPath>.
     */
    getManifestEntry(algorithm) {
        var checksum = this.checksums[algorithm];
        if (checksum === undefined || checksum == null) {
            throw new Error(`No ${algorithm} digest for ${this.absSourcePath}`);
        }
        return `${checksum} ${this.relDestPath}`;
    }

    /**
      * Returns true if this is a payload file.
      *
      * @returns {boolean}
      */
    isPayloadFile() {
        return BagItFile.getFileType(this.relDestPath) == Constants.PAYLOAD_FILE;
    }

    /**
      * Returns true if this is a payload manifest.
      *
      * @returns {boolean}
      */
    isPayloadManifest() {
        return BagItFile.getFileType(this.relDestPath) == Constants.PAYLOAD_MANIFEST;
    }

    /**
      * Returns true if this is a tag file.
      *
      * @returns {boolean}
      */
    isTagFile() {
        return BagItFile.getFileType(this.relDestPath) == Constants.TAG_FILE;
    }

    /**
      * Returns true if this is a tag manifest.
      *
      * @returns {boolean}
      */
    isTagManifest() {
        return BagItFile.getFileType(this.relDestPath) == Constants.TAG_MANIFEST;
    }

    /**
      * getFileType returns the type of BagIt file based on relDestPath.
      * File types are defined in Constants.FILE_TYPES and include
      * 'manifest', 'tagmanifest', 'payload', and 'tagfile'.
      *
      * @param {string} relDestPath - The relative path, within the bag,
      * of the file. For example, 'data/images/photo.jpg' or 'manifest-sha256.txt'.
      *
      * @returns {string}
      */
    static getFileType(relDestPath) {
        if (relDestPath.startsWith('data/')) {
            return Constants.PAYLOAD_FILE;
        } else if (relDestPath.startsWith('manifest-')) {
            return Constants.PAYLOAD_MANIFEST;
        } else if (relDestPath.startsWith('tagmanifest-')) {
            return Constants.TAG_MANIFEST;
        }
        return Constants.TAG_FILE;
    }
}


module.exports.BagItFile = BagItFile;
