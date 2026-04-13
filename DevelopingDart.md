# Getting Started on DART 3 Development

Want to contribute to DART? Start with the video, and then read on below.

[![Getting Started with DART 3 Development](https://img.youtube.com/vi/Oi87ojgJqMw/0.jpg)](https://www.youtube.com/embed/Oi87ojgJqMw?si=-9P2QT6r4cyOr_hu)

## A Note on DART 3 Architecture

We built DART 3 on Go to simplify the app for future maintenance. DART 2 was built on Electron and Node.js, which made the implementation unnecessarily complex and maintenance very difficult. It was normal for DART 2 builds to break every week due to changes in Electron and breaking changes in npm dependencies. We got sick of having to fix code every week, so we ditched Electron and Node.js.

DART 3 was originally intended to run as a local web app that users would access through their favorite browser. This was confusing to some users for a number of reasons, including:

* On some platforms, DART 3 opened a terminal window as well. Users would close it an inadvertantly kill the app.
* If users closed their browser window, the app would continue to run, unbeknownst to the user.

To solve these issues, we use [Wails](https://wails.io/) to provide the UI. It communicates with the local web server. The two "apps" run in a single process and include an app icon in the task bar, so users know it's running and can bring up the running app at any time by clicking on the icon.

Because it talks to a local web server, DART 3 is not a traditional Wails app. It relies on the following technologies to perform core operations:

* [Wails](https://wails.io/) for the front-end UI
* The [Gin Web Framework](https://gin-gonic.com/) for processing HTTP requests
* [SQLite](https://sqlite.org/) to store information about jobs and configuration settings
* [DART Runner](https://github.com/APTrust/dart-runner) for executing jobs

DART 3 is essemtially a visual editor for construction JSON instructions that tell DART Runner how to execute a job. Users click through the DART interface to describe:

* Which files to bag
* What metadata to apply
* Where to send the bag

DART 3 constructs a JSON description of what the user just said they want to do, then it hands that description to DART Runner to create the bag, apply the metadata, and upload the bag. While DART Runner can run in stand-alone mode as its own app, DART 3 includes an embedded version of DART Runner, and it uses that embedded version to do its work. That way, the user has to install only one app, and all DART 3 work occurs within a single process.


## No Plugins in DART 3

DART 2 included a plug-in architecture for developers to add their own features. DART 2's internal architecture was too complex for most developers (including its authors) to meddle with, so the plugin architecture allowed users to add features without having to look at the internals.

We found that after 8 years, only one group ever used the plugin system, so we abandoned it for DART 3. The underlying Go code in DART 3 is much simpler than the JavaScript code in DART 2, and much easier for new developers to work on. If you want to add features to DART 3, you can create a new branch, make your changes, then open a pull request.


## Setting Up a DART 3 Development Environment

To work on DART 3, you will need to do the following:

1. Install Visual Studio Code or your development environment of choice
1. Clone the DART repo from https://github.com/APTrust/dart
1. Clone the DART Runner repo from https://github.com/APTrust/dart-runner
1. Check the [go.mod](https://github.com/APTrust/dart/blob/master/go.mod) files of both projects and be sure you're running a compatible version of Go.
1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) or a similar container engine. This is required for interactive tests.

After completing these steps, run the following to ensure everything works:

1. Start Docker Desktop, as this is required for testing.
1. Change into the dart-runner directory and run `./scripts/run.sh tests`
1. Change into the dart directory and run `./scripts/run.sh tests`

Running the tests should retrieve all of the Go dependencies. If tests pass, you're ready to start developing. Most test errors are due to Docker containers not starting. Check the output messages for messages about Docker containers, and be sure that Docker Desktop is running.


### Configuring Visual Studio Code

**Note**: The easiest way to find the package below is click on the **Extensions** button in the left nav bar of Visual Studio Code and then type their names into the search box at the top of the left pane.

Install the package [Go for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=golang.go). This includes a number of tools to help with syntax highlighting, code completion, debugging and formatting.

This extension also correctly formats DART's HTML templates. If you use VS Code's standard HTML formatter, it will split the double braces used to mark template instructions, and that will break the templates. (The standard HTML formatter changes `{{ instruction }}` to `{ { instruction } }`, which is invalid.)


## Local DART Runner Setup

Because DART 3 is a visual policy editor for DART Runner, and because DART Runner does the actual work of bagging and uploading files, making meaningful changes to DART 3 often means making changes to DART Runner as well. To simplify the development process, use the `replace` function in DART 3's go.mod file to point to the DART Runner code on your local machine.

This lets DART 3 pick up your most recent DART Runner code changes instantly, without having to download specific DART Runner commits from GitHub. Here's an example of what should be in your DART 3 go.mod during development:

```
// Uncomment this to use local version of dart-runner instead of
// GitHub version. This makes development much quicker, as you
// can instantly pick up changes to dart runner. It's also less
// messy that git submodules.
replace github.com/APTrust/dart-runner => ../dart-runner

require (
	github.com/APTrust/dart-runner v1.0.2
	github.com/gin-gonic/gin v1.10.0
	github.com/google/uuid v1.6.0
	github.com/minio/minio-go/v7 v7.0.97
	github.com/stretchr/testify v1.11.1
	github.com/wailsapp/wails/v2 v2.10.2
)
```

Note the **replace** function above. This tells Go to replace github.com/APTrust/dart-runner with the local directory at `../dart-runner` when testing, building and running.

Also, be sure to do the following when pushing code back to GitHub for a pull request:

1. Comment out the `replace` statement in DART 3's go.mod.
1. Point the require statement for dart-runner to the actual commit you want to include in your DART 3 build. For example, instead of requiring `github.com/APTrust/dart-runner v1.0.2`, you would require somthing like `github.com/APTrust/dart-runner v0.0.0-20210307081110-f21760c49a8d`. You should be able to add this line to your go.mod file by running `go get github.com/APTrust/dart-runner f4f0e131cbaf46741add670978507732b48f735c`

Note that you can ignore these steps if you're making changes only to DART 3 and not to DART Runner.

## Debugging

To debug jobs that upload files, you'll need to start DART 3 and add two Storage Service settings. These settings tell DART how to connect to locally-running Docker S3 and SFTP containers.

1. Open a terminal in the DART 3's top-level directory.
1. Run `./scripts/run.sh services`. After a few seconds, this will open a browser window at http://localhost:8444/.
1. In the DART browser window, click **Settings > Import Settings**.
1. Select **Import from JSON (Cut and Paste)**.
1. Paste the following JSON into the **Settings JSON** textbox, then click **Import**.

Note that you will need to change the path in the JSON below, `/Users/diamond/aptrust/dart-runner/testdata/sftp/sftp_user_key`, to a path that is valid on your machine. You will find the sftp_user_key inside the dart-runner project, so this path should point to that project on your computer.

```json
{
  "id": "0ea86806-fed0-4213-b5ac-4223f4d3d4d5",
  "name": "Export Settings - 28 Feb 25 08:22 EST",
  "appSettings": [],
  "bagItProfiles": [],
  "questions": [],
  "remoteRepositories": [],
  "storageServices": [
    {
      "id": "fd86ee37-75f8-4715-b158-bc130e19361e",
      "allowsDownload": true,
      "allowsUpload": true,
      "bucket": "aptrust.receiving.test.test.edu",
      "description": "Local Minio s3 service",
      "host": "127.0.0.1",
      "login": "minioadmin",
      "loginExtra": "",
      "name": "Local Minio",
      "password": "minioadmin",
      "port": 9899,
      "protocol": "s3"
    },
    {
      "id": "ac876fa0-3e20-4e11-a7bc-b140ab8eb69d",
      "allowsDownload": true,
      "allowsUpload": true,
      "bucket": "uploads",
      "description": "Local SFTP server using SSH key for authentication",
      "host": "127.0.0.1",
      "login": "key_user",
      "loginExtra": "/Users/diamond/aptrust/dart-runner/testdata/sftp/sftp_user_key",
      "name": "Local SFTP (key)",
      "password": "",
      "port": 2222,
      "protocol": "sftp"
    },
    {
      "id": "f18dc316-4bf0-4ae6-96cc-62faa3139c46",
      "allowsDownload": true,
      "allowsUpload": true,
      "bucket": "uploads",
      "description": "Local SFTP service using password authentication",
      "host": "127.0.0.1",
      "login": "pw_user",
      "loginExtra": "",
      "name": "Local SFTP (password)",
      "password": "password",
      "port": 2222,
      "protocol": "sftp"
    }
  ]
}
```

DART 3's [launch.json](https://github.com/APTrust/dart/blob/master/.vscode/launch.json) file includes debugging configuration. The easiest way to debug is to follow these steps:

1. From DART 3's top-level directory, run `./scripts/run.sh services`. This starts Docker containers that run local S3 and SFTP servers.
1. In Visual Studio, click the Run and Debug icon in the left nav bar (the triangle with the insect on it), then click the green triangle next to the "Launch Program" label near the upper left corner of the Visual Studio window.

When you follow these steps, you should be able to debug DART Runner code in addition to DART code. Place a breakpoint in the DART code just before a call to a DART Runner function. Once you hit the breakpoint, you can step into the DART Runner code and begin placing additional breakpoints there.

You can stop the Docker S3 and SFTP containers by pressing Control+C in the terminal window where you started `./scripts/run.sh services`.

## Two Different Run Modes

In development, DART 3 can run in two different modes.

**Web Mode** runs DART 3 in a browser window at http://localhost:8444. This is generally what you want to use during development, as your browser exposes a good set of tools for debugging JavaScript and tracing requests and responses. To run in this mode, run either `./scripts/run.sh dart` or run `./scripts/run.sh services` and then launch DART in debug mode from Visual Studio Code.

The disadvantages of running in web mode are 1) you'll need to hit shift + reload to load script and stylesheet changes, and 2) you'll need to restart the app to load changes to Go code.

In Web Mode, you will always see the following errors in the JavaScript console. You can ignore them, because we don't need Wails to map front-end JavaScript functions to back-end Go functions in web mode.

```
Unsupported Platform
Uncaught TypeError: window.WailsInvoke is not a function
```

**Wails Dev Mode** runs DART 3 in a Wails window. This takes longer to start up, but it lets you see the app the way the user will see it, and it's generally better at reloading when you make code changes. To run in Wails dev mode, simply run `wails dev` in the project's top-level directory.

Note that the main functional difference between web mode and Wails mode is the way the app handles downloads. See the function `DownloadJobDownload` in https://github.com/APTrust/dart/blob/master/server/controllers/download_job_controller.go to understand how the two cases are handled.

## Code Structure

* **.github** - This folder contains GitHub actions and Dependabot settings.
* **.vscode** - Contains config file for Visual Studio Code
* **build** - Contains output files from the build process. These are executable binaries.
* **dart** - Contains the main.go application file. This is the entry point for the app, and this is what we build to create the DART 3 binary.
* **frontend** - This contains Wails-specific files used in the build process. You can ignore these files. We don't edit them.
* **scripts** - Contains Bash scripts for running, testing and building DART.
* **server** - Contains all of our custom DART code.
  * **assets** - Contains front-end assets, including scripts, stylesheets, fonts and images.
  * **build_support** - Contains files used for building the MacOS version of the app. These files may be obsolete since we moved to Wails.
  * **controllers** - Contains the controllers responsible for responding to HTTP requests coming from the DART front end.
  * **views** - Contains HTML templates used by the controllers to render front-end HTML.
  * **dev_loader.go** - Dynamically loads HTML templates, JavaScript files, stylesheets and images when DART runs in the local development environment. (That is, when DART is run using `./scripts/run.sh dart`.)
  * **release_loader.go** - Loads HTML templates, scripts, stylesheets and images when DART is run in production mode as a compiled application.
  * **server.go** - Sets up the DART HTTP server and maps routes to controller functions.
* **testdata** - Contains data used in unit and integration tests that are called by `./scripts/run.sh tests`

## DART 3 Web Requests

When a user clicks a button or link in DART 3, the click generates an HTTP request to the locally-running gin web server. This server listens only on localhost (127.0.0.1) and does not accept outside connections. The server then processes the request using the handler specified in the [server.go file](https://github.com/APTrust/dart/blob/master/server/server.go), where the initRoutes function maps requests to handlers.

A typical request-response pattern involves a request handler parsing and executing a request and then populating a template from the `server/views` directory and returning the result.

In addition to the obviously-named controllers, the `server/controllers` directory contains a few additional files of interest. These include:

* **cookies.go** - This is mainly used for flash cookies, which display a message to the user at the top of the DART page after a successful operation.
* **help_map.go** - This provides context-senstitive help by mapping pages in the DART application to relevant help documents in https://aptrust.github.io/dart-docs/dart3/.
* **pager.go** - Used to page responses in list requests, so the user sees only a limited number of items when they list objects stored in the local database.
* **request.go** - Contains helper functions used by many handlers to begin request processing.

## A Note on JavaScript in DART 3

DART 3 uses JavaScript as little as possible. This was a deliberate design decision. After years of using Electron and Node.js in DART 2, we came to believe that Electron and Node were designed by psychopaths to torture fools, and that choosing JavaScript means your project will be plagued by insurmountable technical debt before you've even written a line of code.

In addition to bootstrap.js and jQuery, DART 3 uses less than 300 lines of [globally available JavaScript](https://github.com/APTrust/dart/blob/master/server/assets/js/application.js), plus some smaller snippets that are loaded only when necessary. For example, the [Storage Service form](https://github.com/APTrust/dart/blob/master/server/views/storage_service/form.html) incudes some script specific to that form. Functions in that template will not pollute the global namespace because they are loaded only when that page is loaded. Keeping JavaScript together with the HTML it acts on simplifies the development process and ensures script is loaded only where it is needed.

Keep in mind that because DART talks to a local web server, we don't need to care about transfer times, compression, script minification, or any of the other rutime and build-time complexities of normal web development. DART 3 keeps things simple.

## Running Jobs

As mentioned above, DART is primarily a policy editor in which users describe what they want DART Runner to do. DART merely presents an intuitive UI in which the user can edit a job description, then it saves the job description to the local SQLite database.

When DART runs a job, it pulls the job description from the local database and passes it to DART Runner. For jobs involving bagging, this happens in the [JobRunController](https://github.com/APTrust/dart/blob/master/server/controllers/job_run_controller.go). Upload-only jobs are run in the [UploadJobController](https://github.com/APTrust/dart/blob/master/server/controllers/upload_job_controller.go), while download-only jobs run in the [DownloadJobController](https://github.com/APTrust/dart/blob/master/server/controllers/download_job_controller.go).

Upload and download jobs are fairly simple. Bagging jobs are more complex. Here's what happens in the `JobRunExecute` function of the [JobRunController](https://github.com/APTrust/dart/blob/master/server/controllers/job_run_controller.go):

1. Retrieve a description of the job from the local database.
1. Pass that description to DART Runner, along with a MessageChannel.
1. Start the job in DART Runner by calling `core.RunJobWithMessageChannel`.
1. Listen for messages from DART Runner on the message channel and pass those messages to the front end using server-sent events.

The front end uses these events to move the progress bars in the UI and to tell the user when the job is complete and what the outcome was. The code that handles all that is in [views/partials/job_run.html](https://github.com/APTrust/dart/blob/master/server/views/partials/job_run.html). It's in the partials directory because that code is used both for running jobs and workflows.

If you need to debug the front-end UI for running jobs, you can add `console.log()` statements to the JavaScript in [views/partials/job_run.html](https://github.com/APTrust/dart/blob/master/server/views/partials/job_run.html).

