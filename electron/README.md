# Easy Store - Electron

Electron provides the UI for the Easy Store tools. The UI allows non-technical users to define workflows and then to create jobs based on those workflows. Behind the scenes, the Electron UI simply passes job descriptions to the same command-line tools that more advanced users access through scripting languages. It can even allow you to define a set of jobs and then run them later from the command line.

A workflow will typically include:

1. Packaging a bag according to some pre-defined BagIt profile, such as the APTrust or DPN BagIt profile.
2. Shipping that bag off to some remote storage area, such as an S3 bucket, for preservation or for ingest into a repository such as APTrust.

A job simply applies a workflow to a specific file or set of files. For example, a user may choose a directory of files to go through the workflow that creates an APTrust bag and uploads it to APTrust.

When a user creates a job through the UI, the UI simply creates the same JSON job description that a more technical user would create through a scripting language such as Ruby or Python, and then passes that JSON description on to the same command-line tools that the advanced user would call through their scripts.

## Architecture

The Electron UI consists of the Electron application, which is an embedded browser window, and a small Go HTTP server process running on the same machine. All communication between the Electron UI and the Go server remains on the localhost.

## Why Electron

The Easy Store UI could have been built with just the Go server talking to a local browser window, except for one blocking issue. In order to create a bag, the Go packager must know the full path of every file going into the bag. The current W3C specification forbids browsers from transmitting file paths. The HTML5 specification allows file inputs and drag-and-drop file uploads to access and transmit file contents, but not file paths. Without file paths, it's impossible for the bag structure to replicate the original directory structure of its contents, and it's impossible to create BagIt manifests, which require file paths.

Electron allows full access to the file system, and provides access to file paths.

## Why keep the Go server?

If Electron provides full access to the file system, why should we keep the Go server running in the background? Why not write the bagger, the bag validator, and the S3 upload tools in JavaScript, and keep all of the work in a single process, inside a single compiled binary?

Because JavaScript. Period. Some sadist asked the question, "Can we make a language worse than Perl?" Well, let's try. First, we'll make sure it has no namespace support. Then, we'll take out package management and replace it with several competing module systems that don't play well together. We'll also make `this` behave in differently in different contexts, and throw in both `prototype` and `__proto__`, put new variables into the global namespaces unless you tell us not to, and make closures the only safe construct in the language, so you have to define your functions inside of other functions. Is that bad enough?

No.

Let's make minification a standard practice, so developers can't even read their own code. Then let's add templating languages like React and Riot.js, so you can mix markup into your code, like PHP developers. We'll also borrow some of the worst practices of Ruby on Rails, like having big chunks of template code parsed and eval'ed by other JavaScript code, to make it harder to trace errors to their source. Is that bad enough?

No.

OK. Let's create Node.js, so you have to think and write in terms of callbacks. Now you're passing closures full of untyped data off into the void to be executed whenever, and there's no longer any concept of linear time. When things go wrong, your stack trace will tell you that your app crashed while executing an anonymous function wrapped in a closure that was created at an unspecified time by an unknown function with untyped data that you can't inspect. Have we finally made something worse than Perl?

Yes. You did it. Congratulations!

I'm not enough of a masochist to rewrite in JavaScript all the Go code that was working and fully tested, but I was enough of a masochist to try. It was like trying to rewrite Shakespeare using Donald Trump's vocabulary and grammar. So we're keeping the Go code for these reasons:

1. We want both the UI and the scriptable commands to use the same code base.
2. We want the code base to be maintainable.
3. We want to be able to distribute the scriptable commands as stand-alone binaries with no outside dependencies.

# Packaging for distribution

The packaging process is still to be determined, but the Electron packager is here:

https://github.com/electron-userland/electron-packager

And note that this page includes links to installers that will install the package on different platforms after it's built.
