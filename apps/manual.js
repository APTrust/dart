var manual = `
dart-cli - DART command line interface.

  Validate BagIt packages according to a BagIt profile.

  Usage: dart-cli -- -c <cmd> -p path/to/bagit/profile.json [-v] path/to/bag

  *** Note the double dashes before the first option in the command line. ***

OPTIONS:

  -c --command   Required. The command to run. This should be one of:

                 upload: Upload a file to a remote S3 or FTP server.

                 validate-profile: Validate a BagIt profile.

                 validate-bag: Validate a bag according to some BagIt profile.

                 run-job: Run a DART job, which includes packaging and
                 uploading a bag.

  -D --debug     If specified, the validator will send verbose output
                 to stdout.

  -d --dest      The destination to which you want to upload a file.
                 This should be a URL. When specifying --dest in an upload
                 command, you must also specify --source.

  -h --help      Prints this message and exits.

  -o --output    When command is create-bag, this specifies the output file or
                 directory to which to write the bag. If the output parameter
                 has a .tar extension, the bag will be written to a tar file.
                 If it has no extension, DART will create a directory at the
                 specified path and write the bag into that directory (it will
                 not be tarred, zipped, or otherwise serialized).

  -p --profile   Path to BagIt profile json file that describes what
                 constitutes a valid bag. Required when creating or validating
                 bags.

  -s --source    The path or paths to the files and/or directories that should
                 be bagged, validated, or uploaded. This option is valid for the
                 create-bag and upload commands. It can be specified multiple
                 times for create-bag, and only once for the upload command.

  -v --version   Print version and exit.

The final command line parameter is the path to the bag, which can be a
directory or a tar file.

EXIT CODES:

  0   Process completed normally. If the --help or --version flag was specified,
      the program printed a message and exited. Otherwise, operation completed
      successfully.
  1   Process completed normally, but the outcome was not successful. For
      example, a bag or profile was validated and found to have errors.
  2   Missing or invalid command line options. Operation not attempted.
  3   Operation was attempted but failed due to an unexpected error such as a
      missing or unreadable profile or bag.


`
module.exports.manual = manual;
