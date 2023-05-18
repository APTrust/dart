# Developer Notes

**Updated May 18, 2023**

## General Architecture

The DART UI is essentially an editor that produces a JSON document describing a job. A job can include the following:

* A package operation, which describes:
    * which files and folders to package
    * which BagIt profile to use when building the package
    * which metadata (BagIt tags) to include in the package
* A validation operation to verify that the bag is complete and valid
* Zero or more upload operations to send copies of the package to remote S3 and/or SFTP services

Once the JSON job description is complete, DART spawns a separate instance of itself, running in non-GUI mode, to run the job. That process emits status information on STDOUT, which the DART GUI reads and displays to the user.

The app has three overall architectures: one for the UI, one for plugins, and one for running jobs.

Because DART is an Electron app, its entrypoint is `main.js`, which includes functions `run()` and `runWithoutUI()`. The first function launches the Electron window. The second is for running jobs.

When DART runs in GUI mode, `main.js` calls `ui/main.js` to launch the Electron window and `ui/application.js` to initialize controllers and other core functionality.

### DART UI: Model-View-Controller

For UI interactions, DART uses an MVC pattern. 

* The models are in the `core` and `bagit` directories.
* Forms to create and edit models are in the `ui/forms` directory.
* Views are in `ui/templates`.
* Controllers are in `ui/controllers`
* The router is in `ui/common/request_handler.js`

DART uses logicless [handlebars templates](https://handlebarsjs.com/) to separate logic from presentation.

When a user clicks a menu item, DART does the following:

1. Sets the hash portion `window.location.href` to a string with the pattern `Controller/Method`. For instance, when clicking the **Jobs > List** menu item, DART sets window.location.href to end with `#Job/List`.
2. Code in `application.js` listens for the `hashchange` event and calls the RequestHandler in `ui/common/request_handler.js`.
3. RequestHandler parses the hash value into a controller name and method name, then calls the specified method on the controller.
4. The controller does its work and returns one of the following, as defined in `ui/controllers/base_controller.js`:
    a. A container content object containing HTML to display in DART's main content container.
    b. A modal content object containing HTML to display in a modal dialog.
    c. A "no content" object if the controller does not need to display anything.
    d. A redirect, if appropriate.
5. After DART renders the container content or modal content, it calls the controller's `postRender` callback, which typically attaches event listeners to the new content DART has just rendered.

### DART Plugins

DART plugins live in the `plugins` directory. They provide capabilities to run jobs and to talk to external services. Plugins don't generally interact with the UI, though they may emit or return text or HTML snippets that are rendered in the UI.

* `plugins/formats` provildes plugins for reading and writing various file formats. Currently, we support reading and writing to/from tar files and the filesystem. The "read" plugins are used for validating bags. The "write" plugins are used for creating bags.
* `plugins/network` provides plugins for sending and retrieving data across a network. DART currently supports the S3 and SFTP protocols.
* `plugins/repository` provides plugins for reading data from a remote repository. DART currently supports reading object and work item metadata from the APTrust registry.

Each type of plugin (format reader, format writer, network provider, and repository provider) simple has to implement a consistent interface. What it does internally is none of DART's concern, so long as it implements the expected methods and emits the expected events.

**[TODO: Document plugin interfaces.]**

### DART Jobs: Child Processes

DART runs jobs in separate child processes. It runs batch jobs (workflows) as a series of separate child processes. These processes have no UI. The simply emit messages on STDOUT, which the DART UI renders visible to user. DART also logs most of the messages coming back from these child processes. 

The code to spawn a child process is in the `forkProcess()` method of `core/util.js`. 

When running a job, the non-GUI instance of DART does the following:

1. Loads job description JSON from a file or from STDIN, or if received a UUID as the `--job` param, it loads the job description from DART's jobs database. (DART stores data as formatter, plain-text JSON. To see where, run DART and click **About** on the **Help** menu.)
2. Runs the job's packaging operation, if there is one.
3. Runs the job's validation operation, if there is one.
4. Runs all of the job's upload operations, if there are any.

If packaging or validation fails, DART will return without attempting subsequent operations.

If package and validation succeed and the job includes multiple uploads, DART will attempt all of the uploads. If one fails, it simply moves on to the next.

These child job processes send information back to the DART GUI through STDOUT.

Also note that DART uses plugins when running jobs. It selects the appropriate plugin at runtime. For example, during the bagging step of a job, DART will choose the filesystem writer if it's bagging to a directory and the tar writer if it's creating a tarred bag. For the upload step, it will choose the S3 plugin or the SFTP plugin, depending on what type of remote service it's uploading to. Because these plugins implement consistent interfaces, DART can simply call addFile() and upload(), regardless of which plugin it's using.

The code for executing jobs is the most complex, brittle, and difficult to debug. Virtually all of the complexity comes from JavaScript's asynchronous nature. Many job operations are inherently synchronous and require complex work-arounds to get JavaScript to act against its own async nature. 

For example, writing files into a tar archive must be done synchronously, adding one file at a time, in order. Still, npm's tar-stream is an async library. If you use it as-is, you are guaranteed to create corrupt and invalid tar files. You have to use it with npm's async queue library, or it won't work at all. The result is a tortuous hairball of Promises, events, callbacks, and listeners. The logic of do A then B then C is virually impossible to follow.

Dart Runner implements the same code in Go, in a simple, straightforward, easily readable way. If the job-running code seems hopelessly complex, it is. JavaScript's async mode is simply not suited to the work we're doing here.

## Testing

To run DART's full test suite, run `npm test -- --runInBand`. 

To run a single test file, follow the command above with the relative path to the file. For example, to run only the tests in `workers/job_runner.test.js`, run `npm test -- --runInBand ./workers/job_runner.test.js`

Note that the test suite does not access the usual DART data files and logs. Tests store their data in **$HOME/.dart-test/data** and **$HOME/.dart-test/data/log/dart.log**. You can print messages to the log using `Context.logger.info`, `Context.logger.warn`, and `Context.logger.error`. 

## Debugging

You can debug DART from Visual Studio code simply by hitting **F5** or choosing **Run > Start Debugging** from the app menu. Note, however, that this will only let you debug the UI code. When DART runs jobs and workflows, it spawns a separate process for each job. Those processes will not be accessible to the debugger. 

## Debugging Jobs

To debug standalone jobs using VS Code, do the following:

1. Follow the [ VS Code node debugging instructions](https://code.visualstudio.com/docs/nodejs/nodejs-debugging) to set Auto Attach to `onlyWithFlag`. Note that you may have to kill and restart your VS Code terminal for the debug settings to take effect.
2. In DART, click on the Job you want to debug.
3. Right click anywhere in the DART window and choose **Inspect Element** from context menu.
4. When the Developer Tools pane opens in DART, click the **Console** tab to get a JavaScript console.
5. Type `dartObjectId` in the console. This will print the UUID of the current job.
6. Open a VS Code terminal from the View menu. Choose **View > Terminal**.
7. In the VS Code terminal, type `node --inspect ./main.js --job <UUID>` where UUID is the dartObjectId you copied from DART.

You can start by setting a breakpoint at the first line of the `run()` method in `workers/job_runner.js`. This is where all jobs start.

Also, note that this works only in the VS Code terminal. Running `node --inspect` from a system terminal won't work.

## Testing Against Local Services

When testing DART interactively, it's handy to have local S3 and SFTP services to test against. Minio can provide a local S3 service. Older versions are easier to run in standalone mode without complex configuration.

In the bin directory of APTrust's [Preservation Services repo](https://github.com/APTrust/preservation-services), you'll find an older version of Minio (one for Linux, one for Mac). Create a folder at `$HOME/tmp/minio`. Then you can run this with the following command:

`minio server --address=localhost:9899 ~/tmp/minio`

Then add a Storage Service to DART with the following settings. Note that older versions of minio use "minioadmin" as the default login and password.

```json
      "name": "Local Minio",
      "description": "Local minio s3 service",
      "protocol": "s3",
      "host": "127.0.0.1",
      "port": 9899,
      "bucket": "test",
      "login": "minioadmin",
      "password": "minioadmin",
      "loginExtra": "",
      "allowsUpload": true,
      "allowsDownload": true,
```

You can stop the minio server with a simple `Ctrl-C`.

If you have Docker, you can set up a local SFTP service by running:

`docker run -p 22:22 -d emberstack/sftp --name sftp`

That server comes from the [Emberstack SFTP repo](https://github.com/emberstack/docker-sftp). DART can talk to it once you add a Storage Service with the settings below. Note that the default login and password is "demo".

```json
      "name": "Local Docker SFTP",
      "description": "Local SFTP service running in Docker. demo/demo",
      "protocol": "sftp",
      "host": "localhost",
      "port": 22,
      "bucket": "",
      "login": "demo",
      "password": "demo",
      "loginExtra": "",
      "allowsUpload": true,
      "allowsDownload": true,
```

To stop the SFTP server, run `docker container ls`, note the random name that docker assigned to the container, then run `docker container stop <random_name>`.
