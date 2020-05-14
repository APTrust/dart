const fs = require('fs')
const path = require('path')

const files = ["package.json", "README.md"]

function bumpVersion(oldVersion, newVersion) {
    let root = path.join(__dirname, '..')
    let packageJson = path.join(root, "package.json")
    let readme = path.join(root, "README.md")

    replaceInFile(packageJson, oldVersion, newVersion, 'first')
    replaceInFile(readme, oldVersion, newVersion, 'all')

    console.log("Don't forget to update ReleaseNotes.md!")
}

function replaceInFile(file, oldVersion, newVersion, firstOrAll) {
    fs.readFile(file, 'utf8', function (err,data) {
        if (err) {
            return console.log(err)
        }
        var regex;
        if (firstOrAll == 'all') {
            regex = new RegExp(oldVersion, 'g')
        } else {
            regex = new RegExp(oldVersion)
        }
        let result = data.replace(regex, newVersion);
        fs.writeFile(file, result, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    });
}

function printUsage() {
    console.log(`
Bump the version in the package.json and README files.

Usage: node bump_version.js oldVersion newVersion

       where oldVersion is something like 2.0.6
       and newVersion is something like 2.0.7
`)
}

if (typeof require !== 'undefined' && require.main === module) {
    let args = process.argv.slice(2)
    if (args.length < 2) {
        printUsage()
        process.exit(1)
    }
    let oldVersion = args[0]
    let newVersion = args[1]
    bumpVersion(oldVersion, newVersion);
}
