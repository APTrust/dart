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
