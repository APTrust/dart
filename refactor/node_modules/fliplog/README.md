# ⛓🔈 fliplog

[![NPM version][fliplog-npm-image]][fliplog-npm-url]
[![MIT License][license-image]][license-url]
[![fliphub][gitter-badge]][gitter-url]
[![flipfam][flipfam-image]][flipfam-url]

[fliplog-npm-image]: https://img.shields.io/npm/v/fliplog.svg
[fliplog-npm-url]: https://npmjs.org/package/fliplog
[license-image]: http://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: https://spdx.org/licenses/MIT
[gitter-badge]: https://img.shields.io/gitter/room/fliphub/pink.svg
[gitter-url]: https://gitter.im/fliphub/Lobby
[flipfam-image]: https://img.shields.io/badge/%F0%9F%8F%97%20%F0%9F%92%A0-flipfam-9659F7.svg
[flipfam-url]: https://www.npmjs.com/package/flipfam

> all-in-one logging tool

![Screenshot](https://cloud.githubusercontent.com/assets/4022631/24160506/46c47d34-0e1f-11e7-8c27-4b653330ae02.png)


------- new ------
- [ ] ansii
- [ ] prettyformat
- [ ] fmtobj
- [ ] cleaner
- [ ] chalk
- [ ] .colored
- [ ] prettysize
- [ ] catchAndThrow
- [ ] listr
```js
var obj = {property: {}}
obj.circularReference = obj
obj[Symbol('foo')] = 'foo'
obj.map = new Map()
obj.map.set('prop', 'value')
obj.array = [1, NaN, Infinity]

log.prettyformat(obj).echo()

const cleaner = log
  .cleaner(true)
  .keys([/array|circularReference|map|property/])
  .data(obj)
  .clean()
  .echo()
```

## usage
```bash
yarn add fliplog
npm i fliplog --save
```

```js
const log = require('fliplog')
```

## 🔠 description

fluent logging with verbose insight, colors, tables, emoji, filtering, spinners, progress bars, timestamps, capturing, stack traces, clearing, boxen, stringifying, code highlighting, notifications, beeping, sparkles, slow-mode, formatting, bar charts, & presets

## 🗝️ legend:
- [👋 basics](#-basics)
- [🎀 stringifying](#-stringifying)
  - [json](#json)
  - [stringify](#stringify)
- [🙊 silencing](#-silencing)
  - [capture all](#capture-all)
  - [return formatted values](#return)
  - [return values](#return)
- [🎨 color](#-color)
  - [chalk](#chalk)
  - [shorthands](#shorthands)
  - [xterm](#xterm)
- [function](#function)
- [😊 emoji](#-emoji)
- [☕ filtering](#-filtering)
  - [🚩 flags](#filter-tags)
  - [filter](#filter--tags)
  - [tags](#filter--tags)
- [🛑 quick](#-quick)
- [⬛ table](#-tables)
- [⚖️ diff](https://github.com/fliphub/fliplog/blob/master/README.md#️-diff)
  - [row](https://github.com/fliphub/fliplog/blob/master/README.md#️-diff)
  - [diffs](https://github.com/fliphub/fliplog/blob/master/README.md#️-diff)
- [🌀 spinner](#-spinner)
  - [multi](#-spinner)
  - [ora](#-spinner)
- [📈 progress](#-progress)
- [🛎 notify](#-notify)
- [🗺 stack traces](#-stack-traces)
- [🔎 finding logs](#-find-logs)
- [⚾ catch errors](#-catch-errors)
- [®️ .register](https://github.com/fliphub/fliplog#️-register)
- [trace](#trace)
- [🆑 clear](#-clear)
- [🕳 deep](#-deep)
  - [verbose vs tosource](#vs)
  - [verbose](#verbose)
  - [tosource](#tosource)
- [💈 highlight](#-highlight)
- [🍰 presets](#-presets)
  - [add your own](#add-your-own)
  - [use built ins](#use-built-ins)
- [⌛ timestamps](#-timestamps)
- [from](#from)
- [🎢 fun](#-fun)
  - [📊 bar chart](#-bar)
  - [📦 box](#-box)
  - [📯 beep](#-beep)
  - [🎇 sparkly](#-sparkly)
  - [🔣 formatting](#-formatting)
    - [🛰 space](#-space)
    - [💱 formatter](#-formatter)
  - [🐌 slow](#-slow)
  - [⏲ timer](#-timer)
  - [⚡ performance](#-performance)
- [resources](#-resources)

## 👋 basics

```js
log
  .data({anyKindOfData: true}) // .json, .stringify, .tosource, .verbose
  .text('text to use, this is what gets colored')
  .color('bold') // any cli-color, chalk, available as shorthands
  .echo() // outputs the log, .return to return the formatted values
```

🆕 [lightweight configurable dependencies](#-performance)


## 🎀 stringifying
### json

[prettyjson](https://www.npmjs.com/package/prettyjson)

```js
// optional second arg for options passed into pretty json
log.json({eh: 'prettified'})
```

### stringify

[javascript-stringify](https://www.npmjs.com/package/javascript-stringify)

```js
// args are the same as javascript-stringify
log.stringify({data: 'can stringify deep things'})
```


## 🙊 silencing
- to disable outputting a log, `.silence()` (optional `true`/`false` arg)
- to disable **all** logs, `.shush()`
- to enable **all** logs, `.unshush()`

### capture all

> capture output of all console logs everywhere

```js
log.startCapturing()

console.log('this will be captured')
log.stopCapturing()

// captured data is available here
const saved = log.savedLog
```

### return

return only echos from fliplogs, useful for getting formatted data.

```js
// formatted data
const {text, data} = log
  .data({catchMeIfYouCan: true})
  .text('gingerbread man')
  .returnVals()

// this returns everything inside, it will call .filter first
const everything = log
  .color('blue.underline')
  .data({canYouHandleIt: true})
  .text('M')
  .return()
```




## 🎨 color

### chalk

![chalks](https://github.com/chalk/ansi-styles/raw/master/screenshot.png)

all [chalk](https://github.com/chalk/chalk) colors available with `.color`

```js
log
.text('\n========================================\n')
.color('bold')
.echo()
```

#### shorthands
```js
log
  .bold('same as calling .color(bold).text(all this text)')
  .echo()
```

### xterm
![cli-colors](https://cloud.githubusercontent.com/assets/4022631/24440335/7edf540c-1408-11e7-8d3b-b460d794f3b0.png)

all [cli-color](https://www.npmjs.com/package/cli-color) are available by calling `.xterm`

```js
log
  .time(true)
  .xterm(202, 236).text(' orange!!! ')
  .echo()
```


## function
because it's javascript, the log is an object... but it can be called as a function for convenience

```js
log({data: true}, 'text', 'color')
```

stack

## 😊 emoji
names using [emoji-commits](https://github.com/aretecode/emoji-commits) are available with `.emoji` (currently 🚧 not all have been ported yet)

```js
log
  .emoji('phone')
  .text('et')
  .data('phone home')
  .echo()
```

## ☕ filtering
comma separated strings, or arrays
a function can also be passed in, the argument will be an object containing the entries [see `flipchain/ChainedMap.entries`](https://www.npmjs.com/package/flipchain#other)

- `verbose` enables everything
- `silent` silences everything
- `!` means disabled

### filter & tags
```js
log
  .filter('!nope, yes')

log
  .tag('unrelated,nope')
  .cyan('you will never see me :-(')
  .echo()

log
  .tag('yes')
  .underline('yay!')
  .echo()
```

### 🚩 flags

this can also be done using cli flags

```bash
yourprogram --flipdebug="!nope,yes"
yourprogram --flipdebug=verbose
```

## 🛑 quick

quickly log data and exit if you want to stop execution at a certain point for
debugging

```js
log.quick({give: 'me'}, 'everything', 'and quit')

// or
log.data({now: 'die'}).exit(1)
```


## ⬛ tables
![Screenshot](http://i.imgur.com/sYq4T.png)

extending [cli-table2](https://github.com/jamestalmage/cli-table2)

```js
log
  .table(['header1', 'header2'], ['row1', 'row2'])
  .echo()

log
  .table(['header1', 'header2'])
  .row({'key1': 'val1'})
  .row({'key2': 'val2'})
  .echo()
```

## ⚖️ diff
using [deep-diff](https://www.npmjs.com/package/deep-diff), you can compare before and after data differences as tables. Data will be cloned so it can be mutated and then compared.

```js
const royalty = {
  posh: true,
}
const lowlyPeasant = {
  pauper: true,
}

log.diff(royalty)
const abomination = deepmerge(royalty, lowlyPeasant)
log.diff(abomination)

log.diffs().echo()
```


## 🌀 spinner

![spinners](https://github.com/sindresorhus/cli-spinners/raw/master/screenshot.gif)

- extends [cli-spinner](https://www.npmjs.com/package/cli-spinner#demo)
- uses [cli-spinners](https://github.com/sindresorhus/cli-spinners)
- `.Spinner` is available on fliplog as the instantiated spinner

#### easy

```js
// easy to color spinners
log.bold().startSpinner('loading...')
setTimeout(() => log.stopSpinner(), 2000)
```

#### advanced

```js
// instance available on log.Spinner
log.startSpinner('spinner message', {
  // optional spinner args
  onTick: () => {},

  // where to output the logs, default process.stdout
  stream: () => {}

  // default 60
  delay: 80,
})

console.log('log this, then spinner shows up again - it is sticky.')

log.stopSpinner()
```

### 🌀🌀 multiple

![multi-spinner](https://cloud.githubusercontent.com/assets/4022631/24937229/00228c10-1ee4-11e7-88ae-5c6f626014cb.gif)

- uses [node-multispinner](https://github.com/codekirei/node-multispinner)


```js
// instance available on log.spinners
log
  .addSpinner('key1', 'spinner 1 msg')
  .addSpinner('key2', 'spinner 2 msg')
  .addSpinner('key3', 'spinner 3 msg')

  // arg is optionally a string for frames
  // or an object for multi-spinner options
  .startSpinners()

// string arg removes by name
setTimeout(() => log.removeSpinner('key1'), 1000)

// empty args removes all
setTimeout(() => log.removeSpinner(), 20000)
```


### ora
- `.ora` is available as a method with [the same options](https://github.com/sindresorhus/ora)
- adds `.fliplog` to the `ora` instance to allow chaining back to fliplog
- returns `ora` instance

```js
// call .ora
log.ora('loading...').start()

// or
log.spinner('loading...', {ora: true})

```


## 📈 progress

![progress bar](https://cloud.githubusercontent.com/assets/4022631/24585493/9b68fea8-1740-11e7-8b52-d98fa13c9301.gif)

- [node-progress](https://github.com/visionmedia/node-progress)

### default
```js
log.progress()
```

### interval callback

total, cb(bar, interval), interval time

```js
log.progress(20, (bar, interval) => {
  bar.tick()
  if (bar.complete) clearInterval(interval)
}, 1000)
```

### advanced

![progress bar download](https://cloud.githubusercontent.com/assets/4022631/24585520/376f2264-1741-11e7-8264-f9f85628e44e.gif)

```js
let contentLength = 128 * 1024
const bar = log.progress('  downloading [:bar] :percent :etas', {
  complete: '=',
  incomplete: ' ',
  width: 20,
  total: contentLength,
}).progressBar

function next() {
  if (!contentLength) return
  bar.tick(Math.random() * 10 * 1024)
  if (!bar.complete) setTimeout(next, Math.random() * 1000)
}
next()
```



## 🛎 notify

![node-notifier](https://raw.githubusercontent.com/mikaelbr/node-notifier/master/example/input-example.gif)

- allows passing in the same options from [node-notifier](https://github.com/mikaelbr/node-notifier)


#### string title and [description]
or a `string` for `title`
```js
log
  .notify('woot!', 'super long and not as important description')
  .echo()
```

#### shorthand (echo immediate)
```js
log.notify('woot!', true)
```




## 🗺 stack traces

### ⚾ catch errors

will output the stack trace formatted and inspected deeply with the error preset

```js
const ForeverAndEver = new Promise(resolve => Promise.resolve())
  .then(() => Promise.reject('💍'))
  .catch(log.catch)
```

### 🔎 find logs
in your entry point, calling `log.track()` will output the location all of the next logs output from.

```js
log.track()

// later on...

log.bold('I cannot be found... oh wait, I was tracked.').echo()
```

you can also track every console.log anywhere

```js
log.trackConsole()

// becomes `eh 'at your-file#the-line-number'`
console.log('me!')
```

### trace
calling `.trace` will output a shortened stack trace to the current location.
```js
log.data({bigData: 'oh'}).trace().echo()
```


## ®️ register

### registerConsole

defines properties on the `console` global and automatically calls `echo` where applicable, for easier access:

```js
log.registerConsole()

console.time('so easy')
console.bold('hullabaloo')
console.error(new Error('eh-rar'))
console.timeEnd('so easy')
console.quick('toodaloo')

// also available
// verbose, info, error, track, trace, note, warning, spinner, time, timeEnd, timeLap timeLapEcho, box, beep, timer, table, diff, diffs, stringify, stack, json, filter, tags, quick, exit, reset, sleep, slow, red, yellow, cyan, underline, magenta, bold
```

### registerCatch

catches uncaught promises and errors, displays them verbosely.

```js
log.registerCatch()

throw new Error('eh')
Promise.reject('eh')
```


## 🆑 clear
> this will clear the terminal (at least, move it down so it is clear)

```js
log.clear()
```


## 🕳 deep

### vs
| goal                          | winner
| -------------                 |:-------------:|
| code source                   | tosource      |
| deep inside objects           | verbose       |
| colors                        | verbose       |

### verbose
using [inspector-gadget](https://www.npmjs.com/package/inspector-gadget), objects are inspected and colorized as deep as configured

```js
log
  .bold('verbose:')
  .data({
    numbers: 1000,
    booleans: true,
    functions: () => {},
    strings: 'wacky wavy fun',
  })
  .verbose(/* optional number for how deep to go */)
  .echo()
```

### tosource
> see the code source
using [tosource](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/toSource) [for nodejs](https://www.npmjs.com/package/tosource) you can look at the source of a variable

```js
log
  .bold('tosource:')
  .data({
    numbers: 1000,
    booleans: true,
    functions: () => {},
    strings: 'wacky wavy fun',
  })
  .tosource()
  .echo()
```

## 💈 highlight

![cli-highlight](https://raw.githubusercontent.com/felixfbecker/cli-highlight/master/media/tests.png)

- [cli-highlight](https://www.npmjs.com/package/cli-highlight) (but will not output wrapping html tags around the code, other options are disabled, default themes are used)

```js
function highlitedWithColors() { return 'notice me' }
log
  .data(highlitedWithColors)
  .tosource()
  .highlight()
  .echo()
```


## 🍰 presets

### add your own
```js
log.addPreset('warning', (chain) => {
  return chain.text('⚠  warning:').color('bgYellow.black').verbose(10)
})
```

### use built-ins
```js
log
  .preset('warning')
  .data('nananenano!')
  .echo()

log
  .preset('error')
  .data(new Error('prettyfull!'))
  .echo()
```


### ⌛ timestamps

```js
log
  .time(true)
  .color('cyan')
  .text('🕳  so deep, so colorful, so meta  🎨  ')
  .data(log)
  .verbose()
  .echo()
```


## from

to use logging from a pure js object, `.from` is available

```js
log.from({
  data: 'data',
  text: 'eh',
  color: 'bold',
  echo: true,
})
```

^ is the same as

```js
log
  .text('eh')
  .data('data')
  .color('bold')
  .echo()
```


## 🎢 fun

these will all be silent by default, so you can easily disable them by filtering your logs or setting silent output which can be exceedingly helpful.

### 🎇 sparkly

![sparkly](https://github.com/sindresorhus/sparkly/blob/master/screenshot.png?raw=true)

- options from [sparkly](https://www.npmjs.com/package/sparkly) can be passed in
- will output a random sparkle if it is not set

```js
log.sparkly().echo()
```

## 📊 bar

![babar](https://github.com/stephan83/babar/raw/master/img/sample.png)

- will output a random bar chart if not set
- options from [babar](https://www.npmjs.com/package/babar) can be passed in

### random

```js
log.bar().echo()
```

### bar

```js
const points = []
for (var i = 0; i < Math.PI * 2; i += Math.PI / 1000) {
  points.push([i, Math.cos(i)]);
}
log.bar(points).echo()
```

### styles and bar

```js
log
  .bar([[0, 1], [1, 5], [2, 5], [3, 1], [4, 6]])
  .barStyles({
    width: 80,
    height: 10,
    color: 'yellow',
    maxY: 100
  })
  .echo()
```

## 📯 beep

![beeper](https://cloud.githubusercontent.com/assets/170270/5261236/f8471100-7a49-11e4-81af-96cd09a522d9.gif)

all options from [beeper](https://www.npmjs.com/package/beeper)

```js
log.beep(1).echo()
```

## 📦 box

![boxen-fliplog](https://cloud.githubusercontent.com/assets/4022631/24585540/d447331a-1741-11e7-83af-e73d308e1794.png)

- all [boxen](https://www.npmjs.com/package/boxen) options

### colors

![boxen-fliplog](https://cloud.githubusercontent.com/assets/4022631/24585616/284cfea2-1744-11e7-94e0-80c2fb031067.png)

```js
// with bold colors
log.bold().box('fliplog').echo()

// echos right away
log.box('fliplog', true)

// use boxen box styles
log
  .boxStyles({borderColor: 'blue'})
  .box('fliplog')
  .echo()
```


## 🔣 formatting

```js
log.data({}).bold('text')

// returns the currently formatted text and data
const {text, data} = log.returnVals()

// returns every single setting as an object, resets
const everything = log.return()
```

### 🛰 space

will output `number` of spaces after your log

```js
log.text('followed by 2 empty lines').space(2).echo()
```

## 🐌 slow

slow mode allows debugging each log step-by-step, and will force a `sleep` usable across all environments using [sleepfor](https://www.npmjs.com/package/sleepfor)

```js
log.slow(1000)
log.emoji('snail').yellow('slow...').echo()
const start = Date.now()
log.emoji('snail').yellow('...slow').echo()
const end = Date.now() - start
```

## ⏲ timer

start, stop, lap, and timer instance using [fliptime](https://www.npmjs.com/package/fliptime)

```js
log
  .startTimer('named')
  .sleep(1000)
  .stopTimer('named')
  .echoTimer('named')
```

or for more customized usage

```js
log.startTimer('named')

sleepfor(1000)

log.stopTimer('named').echoTimer('named')

const fliptime = log.fliptime()
```

### 💱 formatter

allows final formatting of the data before echoing

```js
function cb(data) {
  if (!data || typeof data !== 'object') return data

  Object
    .keys(data)
    .forEach(key => {
      if (typeof data[key] === 'string')
        data[key] = data[key].replace(/\s{2}/gmi, ' ')
      else if (Array.isArray(data[key]))
        data[key] = data[key].map(a => cb(a.name))
    })

  return data
}

const fixture = {
  str: 'I  have  too  many  spaces',
  arr: [{name: 'eh'}, {noname: 'just undefined'}],
}

log
.formatter(cb)
.data(fixture)
.echo()
```

## ⚡ performance

#### ⚙ config
to keep the module lightweight, almost all functionality is added through plugins.

the dependencies that are installed can be configured by a package json config, or by using magic npm tags which contain the configs.

the available options are:
- `min`,
- `cli`,
- `debugging`,
- `formatting`,
- `fun`,
- `latest` (default)

##### 📘 package.json
```js
"fliplog": ["debugging"],
```

##### 📘 magic tags
```bash
npm i --save fliphub@cli
npm i --save fliphub@formatting
```


[see the full preset list](https://github.com/fliphub/fliplog/wiki/dynamic-dependencies)

#### requiring

all non-core dependencies are required when functions are called. this way, only the used-functionality is loaded.

additionally, almost all of the functions are not formatted until `.echo()`, so they will not have dependencies loaded when echoing is false which means code does not have to be changed for production.

if `echo(false)` or [filtering](#-filtering) disables the output, they are never called.

## 🔗 resources
- for more on the library used for fluent apis, see [⛓ flipchain](https://www.npmjs.com/package/flipchain)


## 📝 TODO
- to file 📒
- to stream
- middleware alongside .return
- configure which keys are persistent across instances

[flipchain-url]: https://www.npmjs.com/package/flipchain
[npm-image]: https://img.shields.io/npm/v/fliplog.svg
[npm-url]: https://npmjs.org/package/fliplog
[standard-image]: https://img.shields.io/badge/code%20style-standard%2Bes6+-brightgreen.svg
[standard-url]: https://github.com/aretecode/eslint-config-aretecode
[license-image]: http://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: https://spdx.org/licenses/MIT
[gitter-badge]: https://img.shields.io/gitter/room/fliphub/pink.svg
[gitter-url]: https://gitter.im/fliphub/Lobby
[spinner-img]: https://raw.githubusercontent.com/helloIAmPau/node-spinner/master/img/spinner.gif
