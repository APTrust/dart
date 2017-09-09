# riot-tmpl Changes

### v3.0.8
- Using shared regex parser for browser and server versions.
- Fix to incorrect regex that matches literal regexes.

### v3.0.7
- Fix issues with serving to the compiler in the browser.
- Fix [riot#2361](https://github.com/riot/riot/issues/2361) with a new method.
- Refactorization of the spliter (`brackets.split`).

### v3.0.6 (UNPUBLISHED)
- Fix [riot#2361](https://github.com/riot/riot/issues/2361) with a new method.
- Refactorization of the spliter (`brackets.split`).

### v3.0.5
- Fix [riot#2361](https://github.com/riot/riot/issues/2361)

### v3.0.4
- Add better error reporting messages [tmpl#21](https://github.com/riot/tmpl/pull/21)
- Add our official eslint-config file to lint the source code

### v3.0.2
- Change the way of detecting the tag names in case of errors

### v3.0.1
- Change Avoid to use `console.error` if a user has defined already a custom error function
- Change prefer lowercase to debug tags names

### v3.0.0
- Change output all the template errors in the console using `console.error`

### v2.4.2
- Fix [riot#2002](https://github.com/riot/riot/issues/2002) : getting `Unexpected token '('. Expected a property name.` inside riot.js code (bug present in iOS 9.3.0)
- Fix [riot#1588](https://github.com/riot/riot/issues/1588) : Syntax Error: Invalid character \0129 (riot+compiler.min)

### v2.4.1
- Fix [riot#1916](https://github.com/riot/riot/issues/1916) : Can't access variable without this in riot 2.5
- Added function to clear the internal expressions cache.

### v2.4.0
- It closes [riot#1076](https://github.com/riot/riot/issues/1076) using a fork of [notevil](https://github.com/mmckegg/notevil)

### v2.3.22
- It has changed the character used to hide quoted strings and regexes, maybe this fix [riot#1588](https://github.com/riot/riot/issues/1588) : Syntax Error: Invalid character `\0129` (riot+compiler.min).
- Removed support for raw expressions. It is unlikely this feature will be implemented in v2.3.x
- Update devDependencies

### v2.3.21
- Refactorization, now `tmpl` and `brackets` are ~5% faster.
- Removed unused `tmpl.isRaw` function (internal).
- Changes to comments.
- Files to preprocess are moved from the "lib" to the "src" directory, "lib" was removed.

### v2.3.20
- Fixed lint issues with new .eslintrc.yml, almost compatible with [JavaScript Standard Style](http://standardjs.com/)

### v2.3.19
- Fixed issues with double quotes.

### v2.3.18
- Regression of optimized regexes not working in IE9/10.
- Fix [riot#1416](https://github.com/riot/riot/issues/1416) : Issue with space in expression of `each`.
- Fix: when calling the compiler with different brackets, `brackets.array` changes the global configuration (`riot.settings.brackets`).
- Both, `brackets` and `tmpl`, has a new property `version` (string).
- Brackets changes in browsers though `riot.settings.brackets` has immediate effect and always reflect the brackets in use, the `brackets.settings` property is not neccesary and will be removed in v2.4.0

### v2.3.15
- Important regression of optimized regexes not working in IE9/10.

### v2.3.14
- Fix #11 : Can't output expressions without evaluation.
- Fixed issues with regex detection in brackets.js and revision of other regexes.
- Fixed issues with istanbul and new versions of npm in the Makefile.
- Revision of devDependencies, including istanbul for npm 2/3 compatibility.
- Preparation for use as ES6 module through [rollup.js](http://rollupjs.org/)
- Removed internal functions from the documentation.
- Updated tests.
