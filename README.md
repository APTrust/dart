# DART 3

DART 3 is currently in ALPHA mode. We encourage you to use it for testing and to report bugs and feature requests at https://github.com/APTrust/dart/issues.

DO NOT USE THE ALPHA VERSION FOR ESSENTIAL PRODUCTION WORKFLOWS! Wait for a stable release build if you want to use this in production.

## Known Issues

Major features are generally known to work in the current alpha build. However, the build has some known issues, including:

* After DART 3 starts on MacOS, the dock icon bounces for several minutes, and there's no way to stop it
* DART 3 has no dock icon on Windows or Linux
* On all platforms, DART 3 continues to run in the background, even after you close the browser window. Then only way to stop it is to use the task manager, search for "dart3" and click "End Task"
* importing settings from DART2 doesn't work yet
* trying to package in any format other than BagIt may cause errors
* loose (untarred) bags are not supported yet

## Feature Comparison

This table shows the list of features in DART 2 and DART 3 Alpha 1. We will update this list as necessary with each new alpha release of DART 3.

**Last Updated: March 11, 2024**

 **Feature**                                    | **DART 2**   | **DART 3**   | **Notes**
------------------------------------------------|--------------|--------------|-------------------------------------------------------------------------------------------
 **Dashboard - Show Recent Jobs**               | Yes          | Yes          |
 **Dashboard - Show Recent APTrust Work Items** | Yes          | Yes          |
 **View/Edit Application Settings**             | Yes          | Yes          |
 **Import BagIt Profiles**                      | Yes          | Yes          |
 **Export BagIt Profiles**                      | Yes          | Yes          |
 **Edit/Customize BagIt Profiles**              | Yes          | Yes          |
 **Remote Repositories**                        | APTrust only | APTrust only |
 **S3 Storage Services**                        | Yes          | Yes          |
 **SFTP Storage Services with password**        | Yes          | Yes          |
 **SFTP Storage Services with SSH key**         | Yes          | Yes          |
 **Export Settings**                            | Yes          | Yes          |
 **Import Settings**                            | Yes          | Yes          |
 **Run Bagging Jobs**                           | Yes          | Yes          |
 **Create tarred bags**                         | Yes          | Yes          |
 **Create loose bags**                          | No           | No           |
 **Create gzipped bags**                        | No           | Yes          | Currently only supports .tar.gz bags.
 **Run Validation-only Jobs**                   | Yes          | Yes          |
 **Validate tarred bags**                       | Yes          | Yes          |
 **Validate loose bags**                        | No           | No           |
 **Validate gzipped bats**                      | No           | Yes          |
 **Run upload-only jobs**                       | No           | No           |
 **Save artifacts after job runs**              | No           | Yes          | Includes job description, job result, tag files and manifests.
 **Create Workflows**                           | Yes          | Yes          |
 **Run one-off workflow jobs**                  | Yes          | Yes          |
 **Run workflow batch jobs**                    | Yes          | Yes          |
 **Help Link**                                  | Yes          | Yes          |
 **Context-sensitive help links**               | No           | No           | Coming soon.
 **View log files**                             | Yes          | Yes          | Log rotation caused problems with log viewing in DART 2. Fixed in DART 3.
 **Choose how to deal with illegal characters** | No           | Yes          | Choose how DART should deal with illegal filename characters when bagging and validating.


## Getting Started

1. Dowload the app

| Operating System       | Download Link |
| ---------------------- | ------------- |
| Windows (Intel 64-bit) | Coming Soon... |
| Mac (M chips)          | Coming Soon... |
| Mac (Intel chips)      | Coming Soon... |
| Linux (Intel 64-bit)   | Coming Soon... |

2. Open a terminal window and change into the directory containing the dart3 download.

3. Make the app excetable with this command: `chmod +x dart3`

4. (Non-Mac OS) Run the app with this command `./dart3` (Note the leading dot and slash.)

    (Mac OS) Open Finder and command-click on the dart3 app. You'll see a warning about unsigned code. Click the Open button to run DART anyway.

5. Open a browser and go to __http://localhost:8444__

If you want to run DART on a port other than 8444, start it with this command: `./dart3 -port <number>` where is number is any port number you choose. Number should be above 1024 on most systems, because ports below that may be reserved or require root privileges.

On Mac OS, you will only have to use command-click to open DART3 the first time you use it. After that, it should open like any other program. We'll resolve this issue when we get Apple code signing in place.

## Platform Rationale

DART 3 will be the successor to DART 2. DART 2 is an Electron app that whose maintenance has been time consuming and difficult. We chose to write DART 3 in Go as a locally-running web app for a number of reasons, including:

* The tasks DART has to perform can be written much more clearly in Go than in JavaScript. This substantially eases our maintenance burden and makes it easier to add new features. Node's default async model is particularly ill-suited to some of DART's core tasks. (E.g. writing tar files, which MUST be done synchronously.)
* The Go ecosystem is more stable than the Electron/Node ecosystem. We know this from years of maintaining code on both platforms.
* Node and Electron often introduce breaking features in new releases, forcing us to abandon and rewrite working code. The Go language and the major browsers rarely do this.
* The rest of the APTrust ecosystem is written in Go, which allows us to reuse proven code for bagging, validation and file transport. This substantially reduces the burden of having to maintain complex code in two different languages (Go and JavaScript) with identical functionality and behavior.
* Electron apps like DART use substantial resources. Running the DART test suite consumed about 1.5 GB of RAM. DART 3 uses about 14 MB of RAM and considerably less CPU.
* Electron builds did not always behave the same way as Electron in the development environment. Spending days of developer time to debug these issues was a poor use of developer time.
* DART 3 now shares a lot of code with Dart Runner, which ensures more consistent behavior between the two apps.
* The use of Go in DART 3 will eventually allow us to share core code between preservation services, DART, Dart Runner and the [apt-cmd](https://github.com/APTrust/apt-cmd) suite of command-line tools.

We evaluated a number of platforms similar to Electron that would allow us to use Go instead of JavaScript for the heavy work. The most promising of these was [Wails](https://wails.io/), but in our early tests in 2022, we experienced some crashes and blank screens, and we didn't feel the platform was mature enough.

We decided to go with the simplest and most reliable technologies available, where are a basic web server and whichever browser the user prefers.

## Separation of Policy and Implementation

At this point, the DART UI is essentially a policy editor. Its job is to help the user construct a valid description of a job: what is to be packaged, what BagIt profile to use, what metadata to add, and where to send it. Once that description is created, DART serializes it to JSON and passes it off to DART Runner to do the work. DART Runner is the worker that implements the policy.

DART Runner has been in use for several years. We created it to run unattended jobs on servers that had no graphics or windowing system, only a command line. The traditional use case was that a user would create a workflow interactively in DART, then export that workflow to JSON. They would then create a CSV file listing directories to bag up, and they'd tell DART Runner to run everything in the CSV file through the workflow described by the JSON file.

This has worked well in practice for the few people using it. Some users have kicked off bag-and-upload jobs of dozens of terabytes that take weeks to run. It all runs unattended leaving the user is free to work on other things.

While we were maintaining DART 2, we effectively had one policy editor (the DART GUI) and two full implementations of the worker. The DART 2 implementation was written in JavaScript and DART Runner was written in Go. The two worked equally well for bags up to a few gigabytes, but DART Runner worked better for larger bags, particularly in the upload phase, where DART 2 would often stall.

DART 3 brings us down to one policy editor and one implementor, all written in the same language.

## Security Notes

Because DART 3 exposes the local file system in the browser, it listens only on 127.0.0.1, which means it will not accept outside connections.

## Prerequisites for Development

* Go > 1.23
* Ruby > 2.0 (to run build and test scripts) - ** We should convert this to bash **
* Docker (to run Minio and SFTP containers)

## Notes for Developers

Testing: `./scripts/run.rb tests`

Building for realease: `./scripts/build_dart.rb`

Running in dev mode: `./scripts/run.rb dart`

Note that running in dev mode also starts a local SFTP server and a Minio server, both in docker containers. DART will print the URLs and credentials for these local services in the console so you can look into them if necessary.

## Releasing

Since we're in very early alpha phase, we don't have a formal release process yet. For now, follow these steps:

1. Manually update the version name in the [build script](./scripts/build_dart.rb). Look for the VERSION string.
2. Build Windows, Mac and Linux versions using `./scripts/build_dart.rb`
3. Copy the newly built binaries to our S3 bucket:

| Local Binary     | Remote Target |
| ---------------- | ------------- |
| dist/linux/dart3 | Coming Soon... |
| dist/mac-arm64   | Coming Soon... |
| dist/mac-x64     | Coming Soon... |
| dist/windows     | Coming Soon... |

## TODOs

* Come up with a meaningful naming scheme for the binaries or for the S3 folders where we make them available. Users should know whether they're downloading version Alpha-01, Alpha-02, etc. We should probably be tagging these releases as well in GitHub.
* Make naming consistent between local builds and S3 downloads. E.g. mac-x64 vs mac-intel. Choose one or the other.
* More extensive Windows testing for DART 3.
* Add builds for Linux arm-64 and Windows arm-64?
