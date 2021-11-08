var fs = require('fs');
var SFTPServer=require('node-sftp-server');
var server = new SFTPServer({
    privateKeyFile: "sftp-private-key.pem",
    debug: false  // turn on if I'm misbehaving
});

// This server is for testing only. It implements password authentication
// and dummy PUT and GET methods.

let validUser = 'user'
let validPassword = 'password'

server.on('connect', function(auth, info) {
    console.log(auth.username)
    console.log(auth.password)
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
