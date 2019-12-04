const sftp = require('../../plugins/network/sftp_server.js')

// Run a local SFTP server listening on localhost to test DART
// jobs against an SFTP storage service for dev testing. This is
// not for production and the port is not open to the world.

console.log(`Starting SFTP server on 127.0.0.1:${sftp.DEFAULT_PORT}`);
console.log("Ctrl-C to stop");
sftp.start(sftp.DEFAULT_PORT, true);
