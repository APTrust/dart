# DART Refactor

The goal of the refactor is to create maintainable, extensible code so other
developers can contribute to DART.

1. Separate concerns so core code can run in the Electron UI or from the command line.
1. Refactor duplicated code into base classes or helpers.
1. Standardize APIs so they're more intuitive.
1. Use more idiomatic JavaScript.
1. Make it testable with Jest.
1. Document it all with JSDoc.

## Testing

Jest runs tests in parallel by default, but this can cause problems when different
tests are saving different AppSetting values as part of their setup process.
The --runInBand flag tells Jest to run tests sequentially.

See the [Jest CLI reference](https://jestjs.io/docs/en/cli.html)

```
cd refactor
npm test -- --runInBand
```

## Building the Docs

```
cd refactor
./jsdoc.sh
```

After running that, check the index.html file in the docs directory, which the
command will create if it doesn't already exist.

## Building Apps with Nexe

The [nexe npm package](https://www.npmjs.com/package/nexe) builds Node.js
scripts into standalone executables. DART executables are in the apps
directory. You can compile them with the command below. Be sure to run this from
the refactor directory, or the executable will be broken due to bad internal
paths.

```
./node_modules/.bin/nexe -i apps/dart-cli.js -o apps/bin/dart-cli --build mac-x64-11.0.0 --debugBundle=apps/bin/bundle.js
```

The flag `--build mac-x64-11.0.0` tells nexe to package the app with version
11.0.0 of Node.js for 64-bit MacOS.

The first time you build, nexe will compile node from scratch on your machine,
which will take 40-60 minutes.

Subsequent compiles will take just a few seconds.

The file bundle.js will contain all of the JavaScript required to run the app.
The script is also bundled into the compiled dart-cli, but having it in
bundle.js as well allows us to examine what code nexe packed into the compiled
app. This can be useful for debugging. We do not need to distribute bundle.js.
It's for development/debuggin use only.

Note that all of the DART command line tools will be built into a single
executable called `dart-cli`. This is in part because nexe binaries are large
(over 40 MB) and include only about 200k-800k of JavaScript. Better to
distribute one 40 MB binary than ten.

The other advantage to having a single binary is that when we update core DART
code, we have to redistribute only one binary instead of ten.
