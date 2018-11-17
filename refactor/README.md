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
directory. You can compile them like this:

```
cd apps
../node_modules/.bin/nexe validator.js
```

If you happen to get a message like this:

```
Error: mac-x64-11.0.0 not available, create it using the --build flag
```

Then alter the nexe build command like so...

```
../node_modules/.bin/nexe validator.js --build mac-x64-11.0.0
```

...and go out and get some coffee, because nexe is going to download and
compile the entire Node.js runtime on your machine.

Once you have a local build, you can run the command above (with the build
flag) and nexe will know to use that local build. It will not recompile
nodejs unless you delete that build.
