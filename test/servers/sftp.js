var fs = require('fs');
const path = require('path');
var SFTPServer=require('node-sftp-server');
var server = null

// This server is for testing only. It implements password authentication
// and dummy PUT and GET methods.

let validUser = 'user'
let validPassword = 'password'

function start() {
    server = new SFTPServer({
        privateKeyFile: path.join(__dirname, 'sftp-private-key.pem'),
        debug: false  // turn on if I'm misbehaving
    });
    server.on('connect', function(auth, info) {
        var ok = (auth.username == validUser && auth.password == validPassword)
        if (!ok) {
            return auth.reject(['password'], false)
        }
        return auth.accept(function(session) {
            session.on("readfile", function(path, writestream) {
                writestream.write(path + "\n")
                writestream.end()
            });
            session.on("writefile",function (path,readstream) {
                let throwawayFile = process.platform == 'win32' ? 'nul' : '/dev/null'
                let nowhere = fs.createWriteStream(throwawayFile)
                return readstream.pipe(nowhere)
            });
            session.on('readdir', function(path, responder) {
                let data = [
                    {"name": "file1.txt", "size": 42, "mtime": 167564536, "uid": 888},
                    {"name": "file2.txt", "size": 84, "mtime": 167564538, "uid": 999},
                ]
                let i = 0
                responder.on("dir", function() {
                    if (data[i]) {
                        responder.file(data[i].name, data[i])
                        i++
                    } else {
                        return responder.end()
                    }
                  });
            });
        })
    })
    server.listen(9999)
}

function stop() {
    server.server.close()
}

module.exports.start = start
module.exports.stop = stop
