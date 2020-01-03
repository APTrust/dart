// Adapted from https://github.com/mscdex/ssh2/blob/master/examples/sftp-server-download-only.js
// See also https://github.com/mscdex/ssh2-streams/blob/master/SFTPStream.md
// and https://github.com/mscdex/ssh2/blob/37c6193ec64fb07e5ac7d3ac9d7797116e8a01ae/README.md

var crypto = require('crypto');
var constants = require('constants');
var fs = require('fs');
var os = require('os');
var path = require('path');

var ssh2 = require('ssh2');
var OPEN_MODE = ssh2.SFTP_OPEN_MODE;
var STATUS_CODE = ssh2.SFTP_STATUS_CODE;

const USER = "user";
const PASSWORD = "password";

var allowedUser = Buffer.from(USER);
var allowedPassword = Buffer.from(PASSWORD);

const DEFAULT_PORT = 8088;
const TEST_DIR = path.join(__dirname, '..', '..', 'test');
const FILE_TO_READ = path.join(TEST_DIR, 'fixtures', 'sftp_test_file.txt');
const FILE_TO_WRITE = path.join(os.tmpdir(), 'dart-sftp-test-file.txt');
const KEY_FILE = path.join(TEST_DIR,  'certs', 'rsa_test_key');

var server = null;
var _debug = true;

function start(port = DEFAULT_PORT, debug = true) {
    _debug = debug;
    server = new ssh2.Server({
        hostKeys: [fs.readFileSync(KEY_FILE)]
    }, function(client) {
        log('Client connected!');

        client.on('authentication', function(ctx) {
            var user = Buffer.from(ctx.username);
            if (user.length !== allowedUser.length
                || !crypto.timingSafeEqual(user, allowedUser)) {
                return ctx.reject(['password']);
            }

            switch (ctx.method) {
            case 'password':
                var password = Buffer.from(ctx.password);
                if (password.length !== allowedPassword.length
                    || !crypto.timingSafeEqual(password, allowedPassword)) {
                    return ctx.reject(['password']);
                }
                break;
            default:
                return ctx.reject(['password']);
            }

            ctx.accept();
        }).on('ready', function() {
            log('Client authenticated!');

            client.on('session', function(accept, reject) {
                var session = accept();
                session.on('sftp', function(accept, reject) {
                    log('Client SFTP session');
                    var openFiles = {};
                    var handleCount = 0;
                    // `sftpStream` is an `SFTPStream` instance in server mode
                    // see: https://github.com/mscdex/ssh2-streams/blob/master/SFTPStream.md
                    var sftpStream = accept();
                    sftpStream.on('OPEN', function(reqid, filename, flags, attrs) {
                        let safeFilename = FILE_TO_READ;
                        let op = 'read';
                        if (!(flags & OPEN_MODE.READ)) {
                            safeFilename = FILE_TO_WRITE;
                            op = 'write';
                        }
                        log('OPEN ' + filename + " But really opening " +safeFilename);
                        var handle = new Buffer.alloc(4);
                        openFiles[handleCount] = { read: false };
                        handle.writeUInt32BE(handleCount++, 0, true);
                        sftpStream.handle(reqid, handle);
                        log('Opening file for ' +  op)
                    }).on('READ', function(reqid, handle, offset, length) {
                        if (handle.length !== 4 || !openFiles[handle.readUInt32BE(0, true)])
                            return sftpStream.status(reqid, STATUS_CODE.FAILURE);
                        // fake the read
                        var state = openFiles[handle.readUInt32BE(0, true)];
                        if (state.read)
                            sftpStream.status(reqid, STATUS_CODE.EOF);
                        else {
                            state.read = true;
                            sftpStream.data(reqid, 'bar');
                            log(`Read from file at offset ${offset}, length ${length}`);
                        }
                    }).on('WRITE', function(reqid, handle, offset, data) {
                        if (handle.length !== 4 || !openFiles[handle.readUInt32BE(0, true)])
                            return sftpStream.status(reqid, STATUS_CODE.FAILURE);
                        // fake the write
                        var inspected = require('util').inspect(data);
                        var str = data.toString();
                        if (str == "Force upload failure") {
                            log('Upload failed (by agreement)');
                            sftpStream.status(reqid, STATUS_CODE.FAILURE);
                        } else if (str == "Force permission denied") {
                            log('Upload permission denied (by agreement)');
                            sftpStream.status(reqid, STATUS_CODE.PERMISSION_DENIED);
                        } else {
                            log(`Write ${inspected.length} bytes to file at offset ${offset}`);
                            sftpStream.status(reqid, STATUS_CODE.OK);
                        }
                    }).on('CLOSE', function(reqid, handle) {
                        var fnum;
                        if (handle.length !== 4 || !openFiles[(fnum = handle.readUInt32BE(0, true))])
                            return sftpStream.status(reqid, STATUS_CODE.FAILURE);
                        delete openFiles[fnum];
                        sftpStream.status(reqid, STATUS_CODE.OK);
                        log('Closing file');
                    }).on('REALPATH', function(reqid, path) {
                        var name = [{
                            filename: '/tmp/foo.txt',
                            longname: '-rwxrwxrwx 1 foo foo 3 Dec 8 2009 foo.txt',
                            attrs: {}
                        }];
                        sftpStream.name(reqid, name);
                    }).on('STAT', onSTAT)
                        .on('LSTAT', onSTAT);
                    function onSTAT(reqid, path) {
                        if (path !== '/tmp/foo.txt')
                            return sftpStream.status(reqid, STATUS_CODE.FAILURE);
                        var mode = constants.S_IFREG; // Regular file
                        mode |= constants.S_IRWXU; // read, write, execute for user
                        mode |= constants.S_IRWXG; // read, write, execute for group
                        mode |= constants.S_IRWXO; // read, write, execute for other
                        sftpStream.attrs(reqid, {
                            mode: mode,
                            uid: 0,
                            gid: 0,
                            size: 3,
                            atime: Date.now(),
                            mtime: Date.now()
                        });
                    }
                });
            });
        }).on('end', function() {
            log('Client disconnected');
        });
    }).listen(port, '127.0.0.1', function() {
        log('Listening on port ' + this.address().port);
    });

    return server;
}

function log(message) {
    if (_debug) {
        console.log(message)
    }
}


module.exports.DEFAULT_PORT = DEFAULT_PORT;
module.exports.USER = USER;
module.exports.PASSWORD = PASSWORD;
module.exports.start = start;
