const Client = require('ssh2-sftp-client');
const { Context } = require('../../core/context');
const fs = require('fs');
const { OperationResult } = require('../../core/operation_result');
const { Plugin } = require('../plugin');
const { StorageService } = require('../../core/storage_service');
const { Util } = require('../../core/util');


const defaultPutOptions = {
    flags: 'w',
    encoding: null,
    mode: 0o644,
    autoClose: true,
}

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
     * @param {string} filepathOrBuffer - The path to the local file, or a
     * data buffer to be uploaded to the SFTP server.
     *
     * @param {string} keyname - This name to assign the file on the remote
     * server. This parameter is optional. If not specified, it defaults to
     * the basename of filepath. That is, /path/to/bagOfPhotos.tar would
     * default to bagOfPhotos.tar.
     *
     */
    upload(filepathOrBuffer, keyname) {
        let sftp = this;
        if (!filepathOrBuffer) {
            throw new Error('Param filepathOrBuffer is required for upload.');
        }
        if (filepathOrBuffer instanceof String && !keyname) {
            keyname = path.basename(filepathOrBuffer);
        }
        // Don't use path.join; force forward slash instead.
        let remoteFilepath =  keyname;
        if (this.storageService.bucket) {
            remoteFilepath = `${this.storageService.bucket}/${keyname}`;
        }
        let client = new Client();
        let result = this._initUploadResult(filepathOrBuffer, remoteFilepath);
        let connSettings = null;
        let succeeded = false;
        let errorWasHandled = false;
        try { connSettings = this._getConnSettings(); }
        catch (err) {
            result.finish(err);
            sftp.emit('error', result);
            return;
        }
        // Catch unexpected socket closure. Somehow, that does not
        // cause this client to throw an error, so we can't handle
        // it in the normal Promise.error() handler below.
        client.on('close', function(err) {
            if (errorWasHandled) {
                return;
            }
            if (err) {
                result.finish(err.message);
                sftp.emit('error', result);
            } else if (!succeeded) {
                result.finish(Context.y18n.__("Upload failed due to unknown error. The remote host may have terminated the connection."));
                sftp.emit('error', result);
            }
            // We should just emit finish immediately, but when
            // testing against local SFTP server, this closes
            // the upload stream before the server is ready,
            // causing ECONNRESET (even though the write has
            // completed on the server end).
            setTimeout(function() {
                sftp.emit('finish', result);
            }, 500);
        });
        // This handles authentication errors, which will occur before we
        // can even attempt an upload.
        client.on('error', function(err) {
            if (err.message.includes("authentication methods failed")) {
                errorWasHandled = true;
            }
            result.finish(err.message);
            sftp.emit('error', result);
        });
        client.connect(connSettings)
            .then(() => {
                // This library also has a fastPut method that comes
                // with a warning about potential file corruption.
                // Use put for initial release.
                Context.logger.info(`Uploading via sftp to ${remoteFilepath}`);
                return client.put(filepathOrBuffer, remoteFilepath); // defaultPutOptions);
            })
            .then((response) => {
                result.info = Context.y18n.__("Upload succeeded");
                result.finish();
                succeeded = true;
                client.end();
            })
            .catch(err => {
                errorWasHandled = true;
                result.finish(err.message);
                sftp.emit('error', result);
                // client.end() can fail if conn is not established
                if (client && client.sftp) {
                    try { client.end(); }
                    catch(ex) {}
                }
            });
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
        throw 'SFTPClient.download() is not yet implemented.';
    }

    /**
     * Lists files on a remote SFTP server. NOT YET IMPLEMENTED.
     *
     */
    list() {
        throw 'SFTPClient.list() is not yet implemented.';
    }


    _getConnSettings() {
        if (!this.storageService) {
            throw Context.y18n.__("SFTP client cannot establish a connection without a StorageService object");
        }
        let connSettings = {
            host: this.storageService.host,
            port: this.storageService.port || 22,
            username: this.storageService.login,
            //debug: console.log,
        }
        if (!Util.isEmpty(this.storageService.loginExtra)) {
            Context.logger.info(Context.y18n.__("Using private key at %s for SFTP connection", this.storageService.loginExtra));
            connSettings.privateKey = this._loadPrivateKey();
        } else if (!Util.isEmpty(this.storageService.password)) {
            Context.logger.info(Context.y18n.__("Using password for SFTP connection"));
            connSettings.password = this.storageService.password
        } else {
            let msg = Context.y18n.__("Storage service %s has no password or key file to connect to remote server", this.storageService.name);
            Context.logger.error(msg);
            throw msg;
        }
        return connSettings
    }

    /**
     * Loads a private key to be used in establishing an SFTP connection.
     *
     */
    _loadPrivateKey() {
        Context.logger.info(Context.y18n.__("Checking %s for RSA key for SFTP connection", this.storageService.loginExtra));
        if(!fs.existsSync(this.storageService.loginExtra)) {
            throw Context.y18n.__("Private key file %s is missing for storage service %s", this.storageService.loginExtra, this.storageService.name);
        }
        if(!Util.canRead(this.storageService.loginExtra)) {
            throw Context.y18n.__("You do not have permission to read the private key file %s for storage service %s", this.storageService.loginExtra, this.storageService.name);
        }
        let pk = '';
        try {
            pk = fs.readFileSync(this.storageService.loginExtra);
        } catch (ex) {
            throw Context.y18n.__("Error reading private key file %s for storage service %s: %s", this.storageService.loginExtra, this.storageService.name, ex.toString());
        }
        return pk.toString();
    }


    _initUploadResult(filepathOrBuffer, remoteFilepath) {
        let result = new OperationResult('upload', 'SFTPClient');
        result.start();
        if (typeof filepathOrBuffer == 'string') {
            let stats = fs.statSync(filepathOrBuffer);
            result.filepath = filepathOrBuffer;
            result.filesize = stats.size;
            result.fileMtime = stats.mtime;
        } else if (Buffer.isBuffer(filepathOrBuffer)) {
            // This is used for tests only
            result.filepathOrBuffer = "In-memory buffer";
            result.filesize = filepathOrBuffer.length;
        } else {
            throw Context.y18n.__("Must upload filepath or buffer");
        }
        result.remoteURL = this._buildUrl(remoteFilepath);
        return result;
    }

    // Build the remote URL. Don't use path.join because on
    // Windows, that gives us backslashes, and we want forward
    // slashes for SFTP.
    _buildUrl(remoteFilepath) {
        let bucket = this.storageService.bucket;
        let url = `sftp://${this.storageService.host}`;
        if (this.storageService.port) {
            url += `:${this.storageService.port}`;
        }
        if (!remoteFilepath.startsWith('/') && !bucket.startsWith('/')) {
            url += '/';
        }
        if (bucket.trim() != "" && !bucket.endsWith('/')) {
            bucket += '/';
        }
        // Replace multiple slashes with single slash.
        return url + `${remoteFilepath}`.replace(/\/+/g, '/');
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
