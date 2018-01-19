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

# Useful commands

Run these from the electron directory.

## Starting the Electron app in developer mode

`run.rb`

## Building the app

`npm run electron-toolkit`

Click the Installer button, fill out the required fields, and click the Generate Installer button. Note that although the installer can generate cross-platform packages, the documentation discourages it. You should build the Mac package on a Mac, the Windows package on Windows, and the Linux package on Linux.

## Examining the contents of an packaged electron build

This shows you what's packaged in the Electron archive, which should contain the core Electron scripts:

`node node_modules/asar/bin/asar.js list dist/mac/EasyStore.app/Contents/Resources/electron.asar`

This shows you what's packaged in the app archive, which should contain our custom app scripts, along with all of the node modules we depend on, our HTML files, CSS files, custom images, etc.

`node node_modules/asar/bin/asar.js list dist/mac/EasyStore.app/Contents/Resources/app.asar`
