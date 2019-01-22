# hast-util-sanitize

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Chat][chat-badge]][chat]

Sanitize [HAST][].

## Installation

[npm][]:

```bash
npm install hast-util-sanitize
```

## Usage

```javascript
var h = require('hastscript')
var u = require('unist-builder')
var sanitize = require('hast-util-sanitize')
var toHTML = require('hast-util-to-html')

var tree = h('div', {onmouseover: 'alert("alpha")'}, [
  h(
    'a',
    {href: 'jAva script:alert("bravo")', onclick: 'alert("charlie")'},
    'delta'
  ),
  u('text', '\n'),
  h('script', 'alert("charlie")'),
  u('text', '\n'),
  h('img', {src: 'x', onerror: 'alert("delta")'}),
  u('text', '\n'),
  h('iframe', {src: 'javascript:alert("echo")'}),
  u('text', '\n'),
  h('math', h('mi', {'xlink:href': 'data:x,<script>alert("foxtrot")</script>'}))
])

var unsanitized = toHTML(tree)
var sanitized = toHTML(sanitize(tree))

console.log(unsanitized)
console.log(sanitized)
```

Unsanitized:

```html
<div onmouseover="alert(&#x22;alpha&#x22;)"><a href="jAva script:alert(&#x22;bravo&#x22;)" onclick="alert(&#x22;charlie&#x22;)">delta</a>
<script>alert("charlie")</script>
<img src="x" onerror="alert(&#x22;delta&#x22;)">
<iframe src="javascript:alert(&#x22;echo&#x22;)"></iframe>
<math><mi xlink:href="data:x,<script>alert(&#x22;foxtrot&#x22;)</script>"></mi></math></div>
```

Sanitized:

```html
<div><a>delta</a>

<img src="x">

</div>
```

## API

### `sanitize(node[, schema])`

Sanitize the given [HAST][] tree.

###### Parameters

*   `node` ([`HASTNode`][hast]).
*   `schema` ([`Schema`][schema], optional).

###### Returns

[`HASTNode`][hast] — A new node.

### `Schema`

Configuration.  If not given, defaults to [GitHub][] style sanitation.
If any top-level key isn’t given, it defaults to GH’s style too.

For a thorough sample, see the packages [`github.json`][schema-github].

To extend the standard schema with a few changes, clone `github.json`
like so:

```js
var h = require('hastscript')
var merge = require('deepmerge')
var gh = require('hast-util-sanitize/lib/github')
var sanitize = require('hast-util-sanitize')

var schema = merge(gh, {attributes: {'*': ['className']}})

var tree = sanitize(h('div', {className: ['foo']}), schema)

// `tree` still has `className`.
console.log(tree)
```

###### `attributes`

Map of tag-names to allowed attributes (`Object.<Array.<string>>`).

The special `'*'` key sets attributes allowed on all elements.

One special value, namely `'data*'`, can be used to allow all `data`
properties.

```js
"attributes": {
  "a": [
    "href"
  ],
  "img": [
    "src",
    "longDesc"
  ],
  // ...
  "*": [
    "abbr",
    "accept",
    "acceptCharset",
    // ...
    "vspace",
    "width",
    "itemProp"
  ]
}
```

Instead of a single string (such as `type`), which allows any value of that
attribute, it’s also possible to provide an array (such as `['type',
'checkbox']`), where the first entry is the key, and the other entries are
allowed values of that property.

This is how the default GitHub schema allows only disabled checkbox inputs:

```js
"attributes": {
  // ...
  "input": [
    ["type", "checkbox"],
    ["disabled", true]
  ],
  // ...
}
```

###### `required`

Map of tag-names to required attributes and their default values
(`Object.<Object.<*>>`).
If the properties in such a required attributes object do not exist on an
element, they are added and set to the specified value.

Note that properties are first checked based on the schema at `attributes`,
so properties could be removed by that step and then added again through
`required`.

```js
"required": {
  "input": {
    "type": "checkbox",
    "disabled": true
  }
}
```

###### `tagNames`

List of allowed tag-names (`Array.<string>`).

```js
"tagNames": [
  "h1",
  "h2",
  "h3",
  // ...
  "strike",
  "summary",
  "details"
]
```

###### `protocols`

Map of protocols to support for attributes (`Object.<Array.<string>>`).

```js
"protocols": {
  "href": [
    "http",
    "https",
    "mailto"
  ],
  // ...
  "longDesc": [
    "http",
    "https"
  ]
}
```

###### `ancestors`

Map of tag-names to their required ancestral elements
(`Object.<Array.<string>>`).

```js
"ancestors": {
  "li": [
    "ol",
    "ul"
  ],
  // ...
  "tr": [
    "table"
  ]
}
```

###### `clobber`

List of allowed attribute-names which can clobber (`Array.<string>`).

```js
"clobber": [
  "name",
  "id"
]
```

###### `clobberPrefix`

Prefix (`string`) to use before potentially clobbering properties.

```js
"clobberPrefix": "user-content"
```

###### `strip`

Tag-names to strip from the tree (`Array.<string>`).

By default, unsafe elements are replaced by their content.  Some elements,
should however be entirely stripped from the tree.

```js
"strip": [
  "script"
]
```

###### `allowComments`

Whether to allow comment nodes (`boolean`, default: `false`).

```js
"allowComments": true
```

###### `allowDoctypes`

Whether to allow doctype nodes (`boolean`, default: `false`).

```js
"allowDoctypes": true
```

## Contribute

See [`contributing.md` in `syntax-tree/hast`][contributing] for ways to get
started.

This organisation has a [Code of Conduct][coc].  By interacting with this
repository, organisation, or community you agree to abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://img.shields.io/travis/syntax-tree/hast-util-sanitize.svg

[build]: https://travis-ci.org/syntax-tree/hast-util-sanitize

[coverage-badge]: https://img.shields.io/codecov/c/github/syntax-tree/hast-util-sanitize.svg

[coverage]: https://codecov.io/github/syntax-tree/hast-util-sanitize

[downloads-badge]: https://img.shields.io/npm/dm/hast-util-sanitize.svg

[downloads]: https://www.npmjs.com/package/hast-util-sanitize

[chat-badge]: https://img.shields.io/badge/join%20the%20community-on%20spectrum-7b16ff.svg

[chat]: https://spectrum.chat/unified/rehype

[npm]: https://docs.npmjs.com/cli/install

[license]: license

[author]: https://wooorm.com

[hast]: https://github.com/syntax-tree/hast

[schema]: #schema

[github]: https://github.com/jch/html-pipeline/blob/master/lib/html/pipeline/sanitization_filter.rb

[schema-github]: lib/github.json

[contributing]: https://github.com/syntax-tree/hast/blob/master/contributing.md

[coc]: https://github.com/syntax-tree/hast/blob/master/code-of-conduct.md
