# remark-reference-links

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Chat][chat-badge]][chat]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]

[**remark**][remark] plugin to transform links and images into references and
definitions.

## Installation

[npm][]:

```bash
npm install remark-reference-links
```

## Usage

Say we have the following file, `example.md`:

```markdown
[foo](http://example.com "Example Domain"), [foo](http://example.com "Example Domain"), [bar](http://example.com "Example Domain").

![foo](http://example.com "Example Domain"), ![foo](http://example.com "Example Domain"), ![bar](http://example.com "Example Domain").
```

And our script, `example.js`, looks as follows:

```javascript
var fs = require('fs')
var remark = require('remark')
var links = require('remark-reference-links')

remark()
  .use(links)
  .process(fs.readFileSync('example.md'), function(err, file) {
    if (err) throw err
    console.log(String(file))
  })
```

Now, running `node example` yields:

```markdown
[foo][1], [foo][1], [bar][1].

![foo][1], ![foo][1], ![bar][1].

[1]: http://example.com "Example Domain"
```

## API

### `remark.use(referenceLinks)`

Transform links and images into references and definitions.

## Related

*   [`remark-bookmarks`](https://github.com/ben-eb/remark-bookmarks)
    — Link manager
*   [`remark-inline-links`](https://github.com/remarkjs/remark-inline-links)
    — Reverse of `remark-reference-links`, thus rewriting references and
    definitions into normal links and images
*   [`remark-defsplit`](https://github.com/eush77/remark-defsplit)
    — Practically the same as `remark-inline-links`, but with URI-based
    identifiers instead of numerical ones
*   [`remark-unlink`](https://github.com/eush77/remark-unlink)
    — Remove all links, references and definitions

## Contribute

See [`contributing.md` in `remarkjs/remark`][contributing] for ways to get
started.

This organisation has a [Code of Conduct][coc].  By interacting with this
repository, organisation, or community you agree to abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://img.shields.io/travis/remarkjs/remark-reference-links.svg

[build]: https://travis-ci.org/remarkjs/remark-reference-links

[coverage-badge]: https://img.shields.io/codecov/c/github/remarkjs/remark-reference-links.svg

[coverage]: https://codecov.io/github/remarkjs/remark-reference-links

[downloads-badge]: https://img.shields.io/npm/dm/remark-reference-links.svg

[downloads]: https://www.npmjs.com/package/remark-reference-links

[chat-badge]: https://img.shields.io/badge/join%20the%20community-on%20spectrum-7b16ff.svg

[chat]: https://spectrum.chat/unified/remark

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[license]: license

[author]: https://wooorm.com

[npm]: https://docs.npmjs.com/cli/install

[remark]: https://github.com/remarkjs/remark

[contributing]: https://github.com/remarkjs/remark/blob/master/contributing.md

[coc]: https://github.com/remarkjs/remark/blob/master/code-of-conduct.md
