class NetworkFile {
    constructor(opts) {
        opts ||= {}
        this.name = opts.name || ""
        this.size = opts.size || 0
        this.etag = opts.etag || ""
        this.lastModified = opts.lastModified || 0
    }
}

module.exports.NetworkFile = NetworkFile
