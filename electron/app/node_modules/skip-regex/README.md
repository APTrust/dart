[![npm Version][npm-image]][npm-url]
[![License][license-image]][license-url]

# skipRegex

Micro parser for detection of literal regexes.

## Install

```bash
npm install skip-regex --save
```

Two formats:

* CommonJS (ES5) for node and browserify-like bundlers.
* ES6 module (ES6 untranspiled) for Rollup and the like.

### How does it Works?

The `start` position must point to the first slash inside `source` (there's no error detection of this).

From there, `sourceRegex` will find with 99% accuracy the end of a regular literal expression from a start position in the given string.

The returned value is the position of the character following the regex, or `start+1` if this is not a regex.

## Example

```js
import skipRegex from 'skip-regex'

//...
const start = source.indexOf('/')

if (~start) {
  const end = skipRegex(source, start)

  if (end > start + 1) { //looks like a regex
    const regex = source.slice(start, end)
    console.log(`Found regex ${regex} at position ${start}!`)
  }
}
```

## Licence

MIT

[npm-image]:      https://img.shields.io/npm/v/skip-regex.svg
[npm-url]:        https://www.npmjs.com/package/skip-regex
[license-image]:  https://img.shields.io/npm/l/express.svg
[license-url]:    https://github.com/aMarCruz/skip-regex/blob/master/LICENSE
