# Network Plugins

Network plugins provide services that allow DART to send data over a network
using a specific protocol such as S3 or FTP. These plugins should, at a
minimum, be able to do the following:

* Use credentials such as login name and password to connect to a remote
  service.
* Upload local files to a remote service.

DART will include an S3 network client by default. Other useful protocols
include FTP and SFTP.

## SFTP Notes

DART's unit tests run against a Node SFTP server, which does not properly
emulate the behavior of actual SFTP servers. It's better to test against
a real-world server, such as the one in this docker container:

https://hub.docker.com/r/atmoz/sftp

To run manual tests, start the Docker sftp container with this command:

`docker run -p 22:22 -d atmoz/sftp foo:pass:::upload`

Configure an sftp StorageService with the following settings:

- Host: localhost
- User: foo
- Password: pass

After starting the Docker container as noted above, you may have to manually
connect to it from the command line, so that you have its host key in your
ssh hosts file.

```
local:~ yoozer$ ssh localhost
The authenticity of host 'localhost (::1)' can't be established.
ED25519 key fingerprint is SHA256:3WxPp9MParT+tsW/LpcNWR1m4c126aWIR98LVyEgfcw.
Are you sure you want to continue connecting (yes/no)? yes
Warning: Permanently added 'localhost' (ED25519) to the list of known hosts.
yoozer@localhost's password:
```

You can hit Control-C after the last prompt, since your ssh hosts file now
has the key.

If you don't have the key in your hosts file, sftp uploads may fail with the
message "Upload failed due to unknown error. The remote host may have
terminated the connection."
