const { NetworkFile } = require('./network_file');

class ListResult {
    constructor(serviceType) {
        this.serviceType = serviceType
        this.error = null
        this.files = []
    }

    addFile(file) {
        let nf = new NetworkFile()
        if (this.serviceType == 'sftp') {
            nf.name = file.name
            nf.size = file.size 
            nf.lastModified = file.mtime
        } else if (this.serviceType == 's3') {
            nf.name = file.name
            nf.size = file.size 
            nf.etag = file.etag
            nf.lastModified = file.lastModified
        }
        this.files.push(file)
    } 
}

module.exports.ListResult = ListResult
