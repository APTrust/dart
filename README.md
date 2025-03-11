# APTrust DART


## DART 3 (Future Version)

The current version of DART (the one you are looking at) is DART 2. Please continue
to use DART 2 for production and essential workflows!

For you adventurous souls who aren't afraid to break things now and then, <mark>we have an
alpha version of DART 3 available!</mark>

DART 3 includes new features such as support for gzipped bags, improved
uploading, and saving local copies of artifacts such as tag files and manifests.
More importantly, we will be rolling fixes for DART 2 issues into DART 3, which
will be the platform on which we build future features.

If you want to help alpha test DART 3, you'll find links to the latest alpha release,
as well as info about the rationale for DART 3
on the [DART 3 info page](https://github.com/APTrust/dart/tree/dart3).

If you find bugs in DART 3, or if you want to add features, please log your
reports and requests right here in the DART 2 issue tracker:
https://github.com/APTrust/dart/issues

## DART 2 (Current Version)

[![Build Status](https://travis-ci.com/APTrust/dart.svg?branch=master)](https://travis-ci.org/APTrust/dart)
[![Build status](https://ci.appveyor.com/api/projects/status/i5d8hrlan9kph5np?svg=true)](https://ci.appveyor.com/project/aptrust/dart/branch/master)
[![Maintainability](https://api.codeclimate.com/v1/badges/8b51be47cf6ed6aaa698/maintainability)](https://codeclimate.com/github/APTrust/dart/maintainability)


In 2018, APTrust opened its services to depositors at smaller institutions
that did not have the technical resources to package and upload digital
materials into a remote repository.

APTrust created DART, the Digital Archivist's Resource Tool, to provide a
simple drag-and-drop application for non-technical users to package and
upload materials.

While the prototype worked well for our initial depositors, APTrust has a
broader vision for DART to serve a wider community. The next iteration of
DART, will be able to package digital assets in a number of formats and
upload them to any number of repositories. DART will support custom plugins
that allow developers to quickly customize and extend its features to serve
the needs of their own organizations and communities.

DART includes both an intuitive drag-and-drop UI and a scriptable command-line
tool for creating archival packages and sending them to a remote repository.

## Installation

Download the DART installer for your system and then check out our [Getting Started](https://aptrust.github.io/dart-docs/users/getting_started/) page.

* [Mac OSX v2.0.22](https://s3.amazonaws.com/aptrust.public.download/DART/DART-2.0.22.dmg)
* [Windows v2.0.22](https://s3.amazonaws.com/aptrust.public.download/DART/DART+Setup+2.0.22.exe)
* [Linux v2.0.22](https://s3.amazonaws.com/aptrust.public.download/DART/DART_2.0.22_amd64.deb)

> [!NOTE]
> While DART 2.0.22 is the current stable version, an early alpha version of DART 3 is available. Future development will occur in DART 3, but for now, it's not quite ready for production use. We welcome testers and feedback on the new version. If you're interested in learning more, take a look at the [DART 3 README](https://github.com/APTrust/dart-runner/blob/master/server/README.md).


## Documentation

[User and developer docs](https://aptrust.github.io/dart-docs)

[API documentation](https://aptrust.github.io/dart)

[Change Log / Release Notes](ReleaseNotes.md)

## DART User Group

APTrust hosts a [DART User Group](https://aptrust.org/resources/user-groups/dart-user-group/) for the entire digital preservation community. This group will primarily be a [mailing list](https://groups.google.com/a/aptrust.org/g/dart-users), where users can share experiences, ask questions, and support one another. Depending on the level of interest and engagement, we may expand this initiative to include regular virtual meetings and more structured activities in the future.


## DART's Intended Core Features

* Create Submission Information Packages (SIPs) in BagIt format that conform
  to pre-configured BagIt profiles
* Define your own custom BagIt profiles
* Support additional SIP formats (tar, zip, parchive, etc) in the future
* Send SIPs across a network to be ingested into a repository using S3,
  FTP, SFTP, and other protocols.
* Define jobs that describe what items should be packaged, how, and where
  the should be sent.
* Implement all features as plugins, using a well-defined plugin interface
  so developers can add new features without having to dig into core code.
* Provide all of these features in a simple drag-and-drop, point-and-click UI
  that non-technical users can operate with minimal learning curve.
* Provide all of these features in a well-defined command-line interface, so
  they can be scripted using any scripting language.

## Status of Core Features

As of February 27, 2020, the core features required for APTrust depositors
are working in both GUI and command-line mode. These include:

* Creating bags that conform to a selected BagIt profile.
* Validating those bags.
* Sending bags to an S3 bucket. (Or any remote service that supports the
  S3 API).
* Sending bags to an SFTP server.
* Returning basic information from the APTrust repository, including:
  * A list of items recently ingested.
  * A list of pending or in-progress ingests.
* [Settings import/export](https://aptrust.github.io/dart-docs/users/settings/export/), which allows an admin to configure DART and then share settings with multiple users.
* Defining and running basic [Workflows](https://aptrust.github.io/dart-docs/users/workflows/), which describe a repeatable sequence of bagging and upload steps.

### What's Not Working Yet

* Creating bags in formats other than unserialized and tar. (You can build a
  bag as a directory or a tar file, but zip, gzip, and other formats are
  not yet supported.)
* Shipping files in protocols other than S3 or SFTP.
* APTrust has an internal list of a number of minor bugs, all of which
  affect workflows outside the normal APTrust workflow.
* We have not yet formally defined the plugin APIs for developers who want
  to write their own plugins.

## Running Jobs on the Command-Line

DART can run both Jobs and Workflows from the [command line](https://aptrust.github.io/dart-docs/users/command_line/). Most users will want to run Workflows, because they're easier, but we'll start by discussing jobs.

There are several ways to pass job information to DART in command-line mode.
Each of the examples below will run a job withouth launching the graphical
interface. All jobs log to the same log file as the DART UI.

Note the double dashes before the --job and --json options.

```
# Run a job from Job JSON file, which contains a full description
# of the job to be executed.
dist/mac/DART.app/Contents/MacOS/DART -- --job ~/tmp/dart/job.json

# Run a Job stored in the DART Jobs database. The UUID is the unique
# identifier of the job
dist/mac/DART.app/Contents/MacOS/DART -- --job 00000000-0000-0000-0000-000000000000

# Run a job by passing Job JSON directly to stdin
echo '{ ... Job JSON ... }' | dist/mac/DART.app/Contents/MacOS/DART -- --json
```

A job file contains a JSON description of a job, including any or all of
the following operations:

* packaging (which is currently limited to producing BagIt bags)
* validation (which is currently limited validating BagIt bags)
* uploads to one or more remote endpoints (currently limited to S3)

The ability to export a Job JSON file will be coming soon.

## Running Workflows in Command-Line Mode

Workflows define a set of pre-determined actions to take a set of files. For
example, a Workflow may include the following steps:

* Package files in BagIt format
* Using a specified BagIt profile
* With a specified set of default values
* And upload the resulting package to one or more targets

Workflows are easy to run from the command line. To do so, simply create a
JobParams JSON structure with the following info and pass it to DART:

* The name of the workflow to execute
* The name of the package to create
* A list of files to package
* A list of tag values to include in the package

You can then run the Workflow in one of two ways.

```
# Run from a JobParams JSON file
dist/mac/DART.app/Contents/MacOS/DART -- --job ~/tmp/dart/job_params.json

# Run by passing JobParams JSON directly to stdin
echo '{ ... JobParams JSON ... }' | dist/mac/DART.app/Contents/MacOS/DART -- --json
```

## Testing

Jest runs tests in parallel by default, but this can cause problems when different
tests are saving different AppSetting values as part of their setup process.
The --runInBand flag tells Jest to run tests sequentially.

See the [Jest CLI reference](https://jestjs.io/docs/en/cli.html)

```
npm test -- --runInBand
```

### Testing on Windows

A number of tests will fail on Windows if git is set to automatically convert
line endings from `\n` to `\r\n`. Specifically, tests involving bag validation
and checksums will fail because the git checkout on Windows adds an extra byte
to the end of each line of each text file.

If you want these tests to pass, you'll need to disable git's automatic newline
transformations with the following command:

```
git config --local core.autocrlf false
```

## Building

Note that you can bump the version for new releases with the bump_version
script. For example, to bump from 2.x.x to 2.y.y, run `npm run bump 2.x.x to 2.y.y`

To build the DART application into a standalone binary, run this command from
the top-level directory of the project.

```
CSC_LINK="file:///<path to p12>" CSC_KEY_PASSWORD='<secret>' ./node_modules/.bin/electron-builder -mwl
```

This produces a signed, notarized Apple build as well as a Linux build in .deb format
and a Windows build, complete with installer. (Note that the build instruction above
is intended to be run on a Mac to take advantage of Apple code signing.)

You need Python 2 on your Mac for this build to work, because some moron hard-coded
that into the Electron build utilities. They hard-coded the path too, so you may need to
correct it with PYTHON_PATH. (E.g. `PYTHON_PATH='/usr/local/bin/python'`)

The binaries and installers will appear in the /dist folder. For example,
the Mac binary will appear in `dist/mac/DART.app/Contents/MacOS/DART`.

You can run the binary directly from there.

The installers will appear in the dist directory. The important ones are:

| Name | Description |
| ---- | ----------- |
| DART Setup 2.0.22.exe | Windows installer for 64-bit Intel platforms. |
| DART-2.0.22-universal.dmg | Mac universal binary installer. Should run on both Intel and ARM platforms. |
| DART_2.0.22_amd64.deb | Linux installer for 64-bit Intel platforms. (Debian/Ubuntu package format.) |


### Building on Windows & Linux

`./node_modules/.bin/electron-builder --publish never`

## Building the Docs

```
./jsdoc.sh
```

After running that, open the file `docs/DART/2.0.5/index.html` in your browser.

## Testing Against a Local SFTP Server (dev mode only)

To test jobs against a local SFTP server, run the following in a new terminal,
from the root of the DART project directory:

`node ./test/servers/sftp.js`

Note that this works only in dev mode, when you have the source files. This is not part of the release.

The local test SFTP server writes everything to a single temp file. It's not
meant to preserve any data, just to test whether data transfer works via the
SFTP protocol.

If you have docker and want to test against a more robust SFTP server,
follow these steps:

1. Get an SFTP container image from https://hub.docker.com/r/atmoz/sftp/.
1. Add a Storage Service record to your DART installation with the following
   settings:
   ```
   {
		"name": "Docker SFTP",
		"description": "Local docker sftp server",
		"protocol": "sftp",
		"host": "localhost",
		"port": 0,
		"bucket": "upload",
		"login": "foo",
		"password": "pass",
		"loginExtra": "",
		"allowsUpload": true,
		"allowsDownload": true
	}
   ```
1. Run `docker start <container id>`
