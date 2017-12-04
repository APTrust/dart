# Easy Store - Electron

Electron provides the UI for the Easy Store tools. The UI allows non-technical users to define workflows and then to create jobs based on those workflows. Behind the scenes, the Electron UI simply passes job descriptions to the same command-line tools that more advanced users access through scripting languages. It can even allow you to define a set of jobs and then run them later from the command line.

A workflow will typically include:

1. Packaging a bag according to some pre-defined BagIt profile, such as the APTrust or DPN BagIt profile.
2. Shipping that bag off to some remote storage area, such as an S3 bucket, for preservation or for ingest into a repository such as APTrust.

A job simply applies a workflow to a specific file or set of files. For example, a user may choose a directory of files to go through the workflow that creates an APTrust bag and uploads it to APTrust.

When a user creates a job through the UI, the UI simply creates the same JSON job description that a more technical user would create through a scripting language such as Ruby or Python, and then passes that JSON description on to the same command-line tools that the advanced user would call through their scripts.

## Why Electron

The Easy Store UI could have been built with just the Go server talking to a local browser window, except for one blocking issue. In order to create a bag, the Go packager must know the full path of every file going into the bag. The current W3C specification forbids browsers from transmitting file paths. The HTML5 specification allows file inputs and drag-and-drop file uploads to access and transmit file contents, but not file paths. Without file paths, it's impossible for the bag structure to replicate the original directory structure of its contents, and it's impossible to create BagIt manifests, which require file paths.

Electron allows full access to the file system, and provides access to file paths.

# Packaging for distribution

The packaging process is still to be determined, but the Electron packager is here:

https://github.com/electron-userland/electron-packager

And note that this page includes links to installers that will install the package on different platforms after it's built.

# Starting the Electron app

`./electron/run.rb`
