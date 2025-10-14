# SFTP Test Data Folder

This folder contains files for testing against a local SFTP server, which runs inside a Docker container.

* sftp_host_key is a private host key used by the SFTP server
* sftp_host_key is the public half of the host key

* sftp_user_key is a private key used by key_user to connect to the SFTP server
* sftp_user_key.pub is the public half of that user key, and it is effectively copied into /home/key_user/.ssh when the Docker container starts up

* users.conf is a config file descrbing which users exist inside the Docker container and how they can log in. Note that pw_user has a password in the conf file while key_user does not. That means key_user will have to supply an SSH key to log in to the server.

