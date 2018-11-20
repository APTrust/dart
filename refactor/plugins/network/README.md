# Network Plugins

Network plugins provide services that allow DART to send data over a network
using a specific protocol such as S3 or FTP. These plugins should, at a
minimum, be able to do the following:

* Use credentials such as login name and password to connect to a remote
  service.
* Upload local files to a remote service.

DART will include an S3 network client by default. Other useful protocols
include FTP and SFTP.
