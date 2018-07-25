[![Circle CI](https://circleci.com/gh/anandthakker/mdast-util-inject.svg?style=svg)](https://circleci.com/gh/anandthakker/mdast-util-inject)
[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

An [mdast](https://github.com/wooorm/mdast) utility to inject some markdown
into some other markdown, keeping heading structure intact.

## Install

    npm install mdast-util-inject

## Usage

### inject

Inject some markdown into some other markdown at a desired heading.  Heading
levels in the source markdown are adjusted to match the target document
based on the target heading's level.  targetAst is modified in place

**Parameters**

-   `targetHeadingText` **string** The heading to look for in the target ast
-   `targetAst` **object** The target markdown document, as an mdast
-   `toInjectAst` **object** The source markdown to be injected into the target, also as an mdast.

**Examples**

```javascript
var mdast = require('mdast')
var inject = require('mdast-util-inject')

var target = mdast.parse('# A document\n## Section1\nBlah\n## Section2\nBlargh')
var newStuff = mdast.parse('# Some other document\nwith some content')
inject('Section1', target, newStuff)

console.log(mdast.stringify(target))
// outputs:
// # A document
//
// ## Section1
//
// ### Some other document
//
// with some content
//
// ## Section2
//
// Blargh
```

Returns **boolean** whether the specified section was found and content inserted
