const fs = require('fs');
const path = require('path');
const SFTPServer = require("node-sftp-server");

const DEFAULT_PORT = 8088;
const USER = "user";
const PASSWORD = "password";

var server = null;

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
 * server.stop();
 *
 * @param {number} port - The port to listen on. Defaults to 8088.
 */
function start(port = DEFAULT_PORT) {
    if (server != null) {
        return;
    }
    server = new SFTPServer({
        privateKeyFile: path.join(__dirname, '..', '..', 'test', 'certs', 'rsa_test_key')
    });
    server.listen(port);
    server.on("connect", function(auth, info) {
        if (auth.method !== 'password' || auth.username !== USER || auth.password !== PASSWORD) {
            return auth.reject(['password'],false);
        }
        var username = auth.username;
        var password = auth.password;

        return auth.accept(function(session) {
            session.on("readdir", function(path, responder) {
                var dirs, i, j, results;
                dirs = (function() {
                    results = [];
                    for (j = 1; j < 10000; j++){ results.push(j); }
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
                return fs.createReadStream("/tmp/grumple.txt").pipe(writestream);
            });
            return session.on("writefile", function(path, readstream) {
                var something;
                something = fs.createWriteStream("/tmp/garbage");
                return readstream.pipe(something);
            });
        });
    });

    server.on("error", function(err) {
        throw `SFTP Server error: ${err}`
    });
    server.on("end", function() {
        server = null;
    });

    server.stop = function() {
        server.server.close();
    }

    return server;
}

module.exports.DEFAULT_PORT = DEFAULT_PORT;
module.exports.USER = USER;
module.exports.PASSWORD = PASSWORD;
module.exports.start = start;
