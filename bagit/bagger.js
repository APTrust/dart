const BagItFile = require('./bagit_file');
const { PluginManager } = require('../plugins/plugin_manager');

class Bagger extends EventEmitter {
    constructor(job) {
        super();
        this.job = job;
        // BagItFiles
        this.files = [];
        // Temp copies of tag files and manifests.
        // We need to clean these up when we're done.
        this.tmpFiles = [];
    }
}

module.exports.Bagger = Bagger;
