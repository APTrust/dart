# Repository Plugins

Repository plugins can query remote repositories for information about bags or
other data. For example, the APTrust repository plugin can query the APTrust
registry to see whether a bag has been ingested, or is currently in the process
of being ingested.

Repository plugins must provide the following services, at a minimum:

* Connect to a remote repository (usually a REST service) using specified
  credentials.
* Query the remote repository about the status of an item, using an identifier.
* Return a string of plain text, html, or JSON containing information about
  the object.
