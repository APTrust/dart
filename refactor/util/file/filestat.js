/**
 * FileStat is a lightweight version of the fs.Stats object built
 * into the core of Node.js. This class exists so that we can create
 * a Stats-like object to pass into the BagItFile constructor when
 * reading from something that is not a normal file system. Most
 * often, this will be a tar file, zip file, or some other serialized
 * format. In those cases, we'd like to be able to read a bag without
 * extracting it from the tar or zip file.
 *
 * The tar reader emits these lightweight FileStat objects when reading
 * from a serialized file, and other future readers may do the same.
 *
 * @param {Object} [opts] - A optional hash of values.
 * @param {number} [opts.size = -1] - The size, in bytes, of the file.
 * @param {number} [opts.mode = 0o400] - The file mode.
 * @param {number} [opts.uid = 0] - The numeric id of the file owner.
 * @param {number} [opts.gid = 0] - The numeric id of the file group.
 * @param {number} [opts.mtimeMs = 1899-12-31T:00:00:00Z] - The time the
 *                 file was last modified.
 * @param {number} [opts.isTypeFile = false] - Indicates whether the
 *                 item is a file.
 * @param {number} [opts.isTypeDir = false] - Indicates whether the item
 *                 is a directory.
 *
 */
class FileStat {

    constructor(opts = {}) {
        /**
          * The size of the file, in bytes.
          *
          * @type {number}
          * @default 0
          */
        this.size = opts.size || -1;
        /**
          * The file mode.
          *
          * @type {number}
          * @default 0
          */
        this.mode = opts.mode || 0o400;
        /**
          * The numeric id of the user who owns the file.
          *
          * @type {number}
          * @default 0
          */
        this.uid = opts.uid || 0;
        /**
          * The numeric id of the group that owns the file.
          *
          * @type {number}
          * @default 0
          */
        this.gid = opts.gid || 0;
        /**
          * Name is the name of the setting.
          * Setting names should be unique, to prevent confusion.
          *
          * @type {Date}
          * @default 1899-12-31T:00:00:00Z
          */
        this.mtimeMs = opts.mtimeMs || new Date(Date.UTC(0, 0, 0, 0, 0, 0));
        /**
          * Indicates whether this item is a file.
          *
          * @type {boolean}
          * @default false
          */
        this.isTypeFile = opts.isTypeFile || false;
        /**
          * Indicates whether this item is a directory.
          *
          * @type {boolean}
          * @default false
          */
        this.isTypeDir = opts.isTypeDir || false;
    }

    /**
     * isFile returns the value of this object's isTypeFile
     * property. It exists for compatibility with the interface
     * of Node.js's fs.Stats.
     *
     * @returns {boolean}
     */
    isFile() {
        return this.isTypeFile;
    }

    /**
     * isFile returns the value of this object's isTypeDir
     * property. It exists for compatibility with the interface
     * of Node.js's fs.Stats.
     *
     * @returns {boolean}
     */
    isDirectory() {
        return this.isTypeDir;
    }
}

module.exports.FileStat = FileStat;
