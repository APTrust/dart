const { NetworkFile } = require('./network_file');

/**
 * ListResult contains information about files or objects
 * in an remote S3 or SFTP {@link StorageService}.
 *
 */
class ListResult {
    /**
     * Creates a new ListResult object.
     *
     * @param {string} serviceType - The type of service queried. This
     * should match the {@link StorageService} protocol, such as "s3"
     * or "sftp".
     */
    constructor(serviceType) {
        /**
         * The type of StorageService queried to produce the list of files.
         * This should match the {@link StorageService} protocol, such as "s3"
         * or "sftp".
         *
         * @type {string}
         */        
        this.serviceType = serviceType

        /**
         * The first error that occurred while trying to query the remote
         * service. Common errors include incorrect credentials, unreachable
         * host, no such bucket or folder to list, and lack of permissions
         * on the requested bucket/folder.
         * 
         * @type {Error}
         */
        this.error = null

        /**
         * A list of files found in the remote folder/bucket. 
         * 
         * @type {Array<NetworkFile>}
         */
        this.files = []
    }

    /**
     * Add a file to the files list. The file param is flexible because 
     * it has to work with different types of services that return different 
     * types of file records.
     * 
     * Param file should have at least a "name" attribute (string), and 
     * preferably a "size" (number) attribute as well.

     * 
     * @param {*} file 
     */
    addFile(file) {
        let nf = new NetworkFile()
        if (this.serviceType == 'sftp') {
            nf.name = file.name
            nf.size = file.size 
            nf.lastModified = new Date(file.mtime)
            if (!file.mtime && file.attrs && file.attrs.mtime) {
                nf.lastModified = file.attrs.mtime
            }
        } else if (this.serviceType == 's3') {
            nf.name = file.name
            nf.size = file.size 
            nf.etag = file.etag
            nf.lastModified = new Date(file.lastModified)
        }
        this.files.push(file)
    } 
}

module.exports.ListResult = ListResult
