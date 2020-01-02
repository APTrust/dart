const fs = require('fs');
const os = require('os');
const path = require('path');
const SFTPServer = require("node-sftp-server");

const DEFAULT_PORT = 8088;
const USER = "user";
const PASSWORD = "password";

// Because this SFTP server is for testing only, the following
// constants limit what it reads and writes. This is for general
// safety, and it allows our tests to know exactly what they'll
// be getting.

const TEST_DIR = path.join(__dirname, '..', '..', 'test');
//const DIR_TO_READ = path.join(TEST_DIR, 'fixtures');
const FILE_TO_READ = path.join(TEST_DIR, 'fixtures', 'sftp_test_file.txt');
const FILE_TO_WRITE = path.join(os.tmpdir(), 'dart-sftp-test-file.txt');
const KEY_FILE = path.join(TEST_DIR,  'certs', 'rsa_test_key');

var server = null;
var _debug = false;


/**
 * Starts the SFTP server. This is used only when testing the SFTP
 * client plugin. This does not run as part of DART.
 *
 * This currently accepts only password-based connections.
 *
 * @example
 * // Start the server on port 8088
 * const SFTPServer = require('./sftp_server');
 * var server = SFTPClient.start(SFTPServer.PORT);
 * // Stop the server
 * server.server.close();
 *
 * @param {number} port - The port to listen on. Defaults to 8088.
 */
function start(port = DEFAULT_PORT, debug = false) {
    if (server != null) {
        return;
    }
    _debug = debug;
    server = new SFTPServer({
        privateKeyFile: KEY_FILE
    });
    server.listen(port, '127.0.0.1');
    server.on("connect", function(auth, info) {
        if (auth.method !== 'password' || auth.username !== USER || auth.password !== PASSWORD) {
            log(`Rejected login from ${auth.username} (${auth.method})`);
            return auth.reject(['password'],false);
        }
        log(`Accepted login from ${auth.username} (${auth.method})`);
        return auth.accept(function(session) {
            session.on("readdir", function(path, responder) {
                log(`Listing dir ${path}`);
                console.log(path);
                var dirs, i, j, results;
                dirs = (function() {
                    results = [];
                    for (j = 1; j < 100; j++){ results.push(j); }
                    return results;
                }).apply(this);
                i = 0;
                responder.on("dir", function() {
                    if (dirs[i]) {
                        responder.file(dirs[i]);
                        return i++;
                    } else {
                        return responder.end();
                    }
                });
                return responder.on("end", function() {
                });
            });
            session.on("readfile", function(path, writestream) {
                log(`Reading file ${path}`);
                return fs.createReadStream(FILE_TO_READ).pipe(writestream);
            });
            return session.on("writefile", function(path, readstream) {
                if (path == "permission-denied") {
                    log("Returning permission denied")
                    // param 1 is the request id, which should be 1 during
                    // testing, because, there is only one open request
                    // at a time on this server.
                    //
                    // param 3 is the ssh2-streams package error code for
                    // "Permission denied". See
                    // https://github.com/mscdex/ssh2-streams/blob/master/lib/sftp.js#L30
                    return session.sftpStream.status(1, 3, "Permission denied");
                }
                log(`Writing file ${path} to hardcoded ${FILE_TO_WRITE}`);
                let outfile = fs.createWriteStream(FILE_TO_WRITE);
                return readstream.pipe(outfile);
            });
        });
    });

    // When running `node run sftp-server` and testing DART jobs,
    // this server throws ECONNRESET on syscall 'read' even
    // though it successfully writes the uploaded file to disk.
    server.on("error", function(err) {
        log(err);
        log('Server will continue to process requests.')
        return(err);
        //throw `SFTP Server error: ${err}`
    });
    server.on("end", function() {
        log(`Finished read/write operation`);
        //server = null;
    });

    return server;
}

function log(message) {
    if (_debug === true) {
        console.log(`[${new Date().toISOString()}] ${message}`);
    }
}

module.exports.DEFAULT_PORT = DEFAULT_PORT;
module.exports.USER = USER;
module.exports.PASSWORD = PASSWORD;
module.exports.start = start;
