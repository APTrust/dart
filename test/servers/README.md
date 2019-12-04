# Test Servers

Servers in this directory are used for manual testing of DART jobs during
development only. These servers are not part of the DART build or distribution.

## SFTP Server

Use this to manually test DART jobs against an SFTP server. To run:

`npm run sftp-server`

Note that anything you upload to this server gets written to the same temp file.
You can kill the server with Ctrl-C.
