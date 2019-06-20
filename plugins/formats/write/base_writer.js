const async = require('async');
//const EventEmitter = require('events');
//const fs = require('fs');
//const mkdirp = require('mkdirp');
//const path = require('path');
const { Plugin } = require('../../plugin');

class BaseWriter extends Plugin {
    constructor() {
        super();
        /**
         * The total number of files added to the write queue.
         *
         * @type {number}
         */
        this.filesAdded = 0;

        /**
         * The total number of files that have been written into the
         * tar file.
         *
         * @type {number}
         */
        this.filesWritten = 0;
    }

    /**
     * Returns the percent complete of the total write operations.
     * This will be a number between 0 and 100. E.g. 42.833.
     *
     * @returns {number}
     */
    percentComplete() {
        return (this.filesWritten / this.filesAdded) * 100;
    }

    add(bagItFile, cryptoHashes = []) {
        this.filesAdded += 1;
    }

    onFileWritten() {
        this.filesWritten += 1;
    }
}

module.exports.BaseWriter = BaseWriter;
