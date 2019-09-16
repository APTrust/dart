const { Context } = require('../../core/context');
const fs = require('fs');
const { Plugin } = require('../plugin');
const ssh2 = require('ssh2');

class SFTPClient extends Plugin {

    /**
     * Creates a new SFTPClient.
     *
     * @param {StorageService} storageService - A StorageService record that
     * includes information about how to connect to a remote SFTP service.
     * This record includes the host URL, default folder, and connection
     * credentials.
     */
    constructor(storageService) {
        super();
        this.storageService = storageService;
    }

    /**
     * Returns a {@link PluginDefinition} object describing this plugin.
     *
     * @returns {PluginDefinition}
     */
    static description() {
        return {
            id: 'aa7bb977-59b9-4f08-99a9-dfcc16632728',
            name: 'SFTPClient',
            description: 'Built-in DART SFTP network client',
            version: '0.1',
            readsFormats: [],
            writesFormats: [],
            implementsProtocols: ['sftp'],
            talksToRepository: [],
            setsUp: []
        };
    }

    /**
     * Uploads a file to the remote server. The name of the directory into
     * which the file will be uploaded is determined by the bucket property
     * of the {@link StorageService} passed in to this class'
     * constructor.
     *
     * @param {string} filepath - The path to the local file to be uploaded
     * to the SFTP server.
     *
     * @param {string} keyname - This name to assign the file on the remote
     * server. This parameter is optional. If not specified, it defaults to
     * the basename of filepath. That is, /path/to/bagOfPhotos.tar would
     * default to bagOfPhotos.tar.
     *
     */
    upload(filepath, keyname) {
        if (!filepath) {
            throw new Error('Param filepath is required for upload.');
        }
        if (!keyname) {
            keyname = path.basename(filepath);
        }
    }


    /**
     * Downloads a file from the remote server. The name of the default
     * directory on the remote server is determined by the bucket property
     * of the {@link StorageService} passed in to this class'
     * constructor.
     *
     * @param {string} filepath - The local path to which we should save the
     * downloaded file.
     *
     * @param {string} keyname - This name of the file to download from
     * the remote server.
     *
     */
    download(filepath, keyname) {

    }

    /**
     * Lists files on a remote SFTP server. NOT YET IMPLEMENTED.
     *
     */
    list() {
        throw 'SFTPClient.list() is not yet implemented.';
    }


    /**
     * @event SFTPClient#start
     * @type {string} A message indicating that the upload or download is starting.
     *
     * @event SFTPClient#warning
     * @type {string} A warning message describing why the SFTPClient is retrying
     * an upload or download operation.
     *
     * @event SFTPClient#error
     * @type {OperationResult} Contains information about what went wrong during
     * an upload or download operation.
     *
     * @event SFTPClient#finish
     * @type {OperationResult} Contains information about the outcome of
     * an upload or download operation.
     */
}

module.exports = SFTPClient;
