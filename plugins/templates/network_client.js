const { Context } = require('../../core/context');
const { NetworkFile } = require('./network_file');
const { OperationResult } = require('../../core/operation_result');
const path = require('path');
const { Plugin } = require('../plugin');

// Replace class name NETWORK_CLIENT with your actual class name.
// E.g. RsyncClient, ScpClient, etc.
//
// Use a simple search & replace to replace all instance of 
// NETWORK_CLIENT in this file.

class NETWORK_CLIENT extends Plugin {

    /**
     * Creates a new NETWORK_CLIENT.
     *
     * @param {StorageService} storageService - A StorageService record that
     * includes information about how to connect to the remote service
     * that this network client will talk to. 
     * 
     * The StorageService record includes the host address, default remote 
     * folder or bucket, and connection credentials such as login and password.
     * You can use StorageService.loginExtra as the path to a private key file.
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

            // Replace the empty UUID below with a unique one of
            // your own. DART needs UUIDs to load plugins. You can
            // get one at https://www.uuidgenerator.net/
            // ** Required **
            id: '00000000-0000-0000-0000-000000000000',

            // Choose a unique name for your network client.
            // It can be the same as the class name above, 
            // but it must be unique.
            // ** Required **
            name: '',

            // Describe what this plugin does, so users will
            // know why it's installed on their system.
            // ** Required **
            description: '',

            // Version number of this plugin in 0.0 format.
            // ** Required **
            version: '0.0',

            // Leave this empty for network plugins.
            readsFormats: [],

            // Leave this empty for network plugins.
            writesFormats: [],
            
            // List what network protocols this plugin implements.
            // This will typically be only a single protocol.
            // Use lower-case for simplicity.
            //
            // For example, 'scp', 'bittorrent', 'ipfs'.
            // ** Required **
            implementsProtocols: [''],

            // Leave this empty for network plugins.
            talksToRepository: [],

            // Leave this empty for network plugins.
            setsUp: []
        };
    }

    /**
     * Uploads a file to the remote service. Items will go into the bucket
     * or directory name specified in the {@link StorageService} passed in 
     * to this class's constructor.
     *
     * @param {string} filepath - The path to the local file to be uploaded
     * to S3.
     *
     * @param {string} keyname - This name of the key to put into the remote
     * bucket. This parameter is optional. If not specified, it defaults to
     * the basename of filepath. That is, /path/to/bagOfPhotos.tar would
     * default to bagOfPhotos.tar.
     *
     */
    upload(filepath, keyname) {
        if (!filepath) {
            throw new Error('Param filepath is required for upload.')
        }

        // Feel free to change this. Maybe you want keyname to be the same as filepath.
        if (!keyname) {
            keyname = path.basename(filepath)
        }

        // Let's keep a reference to our self, so we
        // don't lose it in the nested functions below.
        let myNetworkClient = this

        // This is the result you'll return.
        let result = new OperationResult('upload', 'NETWORK_CLIENT')
        result.filepath = filepath
        result.info = `Sending ${filepath} to ${this.storageService.url}/${keyname}`

        // Connect to client, using the hostname and credentials in 
        // the StorageService that was passed into this object's constructor.
        //
        // For example, if you're using some hypothetical SCP client library,
        // your code would look something like this. Note the try/catch, and
        // note that we emit an error event. The caller of our upload method
        // is listening to events, and we must emit an error event for the
        // caller to know something went wrong.
        //
        let underlyingClient = new SomeKindOfClient(this.storageService.url, this.storageService.login, this.storageService.password)

        // Set up listeners for any events your client might emit.
        // We need to relay events to our caller, who is listening
        // for 'start', 'error', 'status' and 'finish'. For each
        // of these events, we emit the result object.
        // 
        // These are hypothetical listeners. You'll have to alter them
        // to suit your underlying client. Just be sure they emit what
        // our caller wants to hear.

        underlyingClient.on('start', function(data){
            // Calling result.start() sets required internal info 
            // in the result object.
            result.start()
            myNetworkClient.emit('start', result);
        })

        underlyingClient.on('error', function(err) {
            // Call result.finish with the error message.
            // The result object will set some required internal properties.
            result.finish(err.toString())
            myNetworkClient.emit('error', result);
        })

        // Delete this if it doesn't apply...
        let bytesSent = 0
        underlyingClient.on('data', function(data) {
            // Let's say, hypothetically, the underlying client
            // tells us periodically during the upload that it's
            // just uploaded another chunk. 
            bytesSent += data.size
            myNetworkClient.emit('status', bytesSent)
        })

        underlyingClient.on('close', function(data, error) {
            if (error) {
                // Something went wrong. Emit the error,
                // so our caller knows.
                result.finish(error.toString())
                myNetworkClient.emit('error', result);    
            } else {
                // No error, so we assume upload succeeded.
                // Call result.finish() without an error message,
                // then send the result back to our caller using
                // the 'finish' event to indicate we're done.
                result.finish()
                myNetworkClient.emit('finish', result);    
            }
        })

        // Now our listeners are ready to relay events to our
        // caller. Let's start the upload...
        underlyingClient.connect()
        .then(function() {
            // Replace .put with .send or .upload, or whatever
            // your underlying client does.
            underlyingClient.put(filepath, keyname)
        })
        .then(function() {
            // Include this only if your client doesn't
            // emit a 'close' or 'finish' or other event
            // to indicate completion.
            result.finish()
            myNetworkClient.emit('finish', result);
        })
        .catch(function(err){
            // Something went wrong. Pass it up the chain.
            result.finish(error.toString())
            myNetworkClient.emit('error', result);
        })
    }

    /**
     * Test the connection to a remote host.
     */
    testConnection() {
        // Keep a reference to our self.
        let myNetworkClient = this

        // Get an instance of our underlying client.
        let underlyingClient = new SomeKindOfClient(this.storageService.url, this.storageService.login, this.storageService.password)

        // Our caller is listening for a 'connected' event 
        // if we successfully connect, or an 'error' event 
        // if we can't connect. In both case, send a string
        // as the message.

        underlyingClient.connect().then(() => {
            Context.logger.info(Context.y18n.__('Connection test to %s/%s succeeded', 
                    this.storageService.host,
                    this.storageService.bucket))
            sftp.emit('connected', Context.y18n.__('Success'))
        }).catch(err => {
            Context.logger.error(Context.y18n.__('Connection test to %s/%s failed with error %s', 
                this.storageService.host,
                this.storageService.bucket,
                err.toString()))  
            sftp.emit('error', err)
        }).finally(() => {
            // Clean up any lingering connections.
            // How to tell if they exist depends on your
            // underlying client. Our hypothetical example
            // includes a hypothetical 'isConnected()' method.
            if (underlyingClient.isConnected()) {
                try { client.end(); }
                catch(ex) {}
            }
        });
    }
    
}