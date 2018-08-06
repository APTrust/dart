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

```
cd refactor
npm test
```

## Building the Docs

```
cd refactor
documentation build core/* bagit/* -f html -o docs --sort-order alpha
```
