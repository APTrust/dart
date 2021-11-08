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
                let nowhere = fs.createWriteStream('/dev/null')
                return readstream.pipe(nowhere)
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
