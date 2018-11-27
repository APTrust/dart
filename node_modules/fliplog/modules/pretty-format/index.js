const keyword = require('../')('esutils').keyword
const style = require('../')('ansi-styles')
const printString = require('./printString')

const toString = Object.prototype.toString
const toISOString = Date.prototype.toISOString
const errorToString = Error.prototype.toString
const regExpToString = RegExp.prototype.toString
const symbolToString = Symbol.prototype.toString

const SYMBOL_REGEXP = /^Symbol\((.*)\)(.*)$/
const NEWLINE_REGEXP = /\n/gi

const getSymbols = Object.getOwnPropertySymbols || (obj => [])

function isToStringedArrayType(toStringed) {
  return (
    toStringed === '[object Array]' ||
    toStringed === '[object ArrayBuffer]' ||
    toStringed === '[object DataView]' ||
    toStringed === '[object Float32Array]' ||
    toStringed === '[object Float64Array]' ||
    toStringed === '[object Int8Array]' ||
    toStringed === '[object Int16Array]' ||
    toStringed === '[object Int32Array]' ||
    toStringed === '[object Uint8Array]' ||
    toStringed === '[object Uint8ClampedArray]' ||
    toStringed === '[object Uint16Array]' ||
    toStringed === '[object Uint32Array]'
  )
}

function printNumber(val) {
  if (val != +val) return 'NaN'
  const isNegativeZero = val === 0 && 1 / val < 0
  return isNegativeZero ? '-0' : '' + val
}

function printFunction(val, printFunctionName) {
  if (!printFunctionName) {
    return '[Function]'
  }
  else if (val.name === '') {
    return '[Function anonymous]'
  }
  else {
    return '[Function ' + val.name + ']'
  }
}

function printSymbol(val) {
  return symbolToString.call(val).replace(SYMBOL_REGEXP, 'Symbol($1)')
}

function printError(val) {
  return '[' + errorToString.call(val) + ']'
}

function printBasicValue(val, printFunctionName, escapeRegex, colors) {
  if (val === true || val === false)
    return colors.boolean.open + val + colors.boolean.close
  if (val === undefined)
    return colors.misc.open + 'undefined' + colors.misc.close
  if (val === null) return colors.misc.open + 'null' + colors.misc.close

  const typeOf = typeof val

  if (typeOf === 'number')
    return colors.number.open + printNumber(val) + colors.number.close
  if (typeOf === 'string')
    return (
      colors.string.open + '"' + printString(val) + '"' + colors.string.close
    )
  if (typeOf === 'function')
    return (
      colors.function.open +
      printFunction(val, printFunctionName) +
      colors.function.close
    )
  if (typeOf === 'symbol')
    return colors.symbol.open + printSymbol(val) + colors.symbol.close

  const toStringed = toString.call(val)

  if (toStringed === '[object WeakMap]')
    return (
      colors.label.open +
      'WeakMap ' +
      colors.label.close +
      colors.bracket.open +
      '{}' +
      colors.bracket.close
    )
  if (toStringed === '[object WeakSet]')
    return (
      colors.label.open +
      'WeakSet ' +
      colors.label.close +
      colors.bracket.open +
      '{}' +
      colors.bracket.close
    )
  if (
    toStringed === '[object Function]' ||
    toStringed === '[object GeneratorFunction]'
  )
    return (
      colors.function.open +
      printFunction(val, printFunctionName) +
      colors.function.close
    )
  if (toStringed === '[object Symbol]')
    return colors.symbol.open + printSymbol(val) + colors.symbol.close
  if (toStringed === '[object Date]')
    return colors.date.open + toISOString.call(val) + colors.date.close
  if (toStringed === '[object Error]')
    return colors.error.open + printError(val) + colors.error.close
  if (toStringed === '[object RegExp]') {
    if (escapeRegex) {
      return (
        colors.regex.open +
        printString(regExpToString.call(val)) +
        colors.regex.close
      )
    }
    return colors.regex.open + regExpToString.call(val) + colors.regex.close
  }
  if (toStringed === '[object Arguments]' && val.length === 0)
    return (
      colors.label.open +
      'Arguments ' +
      colors.label.close +
      colors.bracket.open +
      '[]' +
      colors.bracket.close
    )
  if (isToStringedArrayType(toStringed) && val.length === 0)
    return (
      val.constructor.name + colors.bracket.open + ' []' + colors.bracket.close
    )

  if (val instanceof Error)
    return colors.error.open + printError(val) + colors.error.close

  return false
}

function printList(
  list,
  indent,
  prevIndent,
  spacing,
  edgeSpacing,
  refs,
  maxDepth,
  currentDepth,
  plugins,
  min,
  callToJSON,
  printFunctionName,
  escapeRegex,
  colors
) {
  let body = ''

  if (list.length) {
    body += edgeSpacing

    const innerIndent = prevIndent + indent

    for (let i = 0; i < list.length; i++) {
      body +=
        innerIndent +
        print(
          list[i],
          indent,
          innerIndent,
          spacing,
          edgeSpacing,
          refs,
          maxDepth,
          currentDepth,
          plugins,
          min,
          callToJSON,
          printFunctionName,
          escapeRegex,
          colors
        )

      if (i < list.length - 1) {
        body += colors.comma.open + ',' + colors.comma.close + spacing
      }
    }

    body +=
      (min ? '' : colors.comma.open + ',' + colors.comma.close) +
      edgeSpacing +
      prevIndent
  }

  return (
    colors.bracket.open +
    '[' +
    colors.bracket.close +
    body +
    colors.bracket.open +
    ']' +
    colors.bracket.close
  )
}

function printArguments(
  val,
  indent,
  prevIndent,
  spacing,
  edgeSpacing,
  refs,
  maxDepth,
  currentDepth,
  plugins,
  min,
  callToJSON,
  printFunctionName,
  escapeRegex,
  colors
) {
  return (
    colors.label.open +
    (min ? '' : 'Arguments ') +
    colors.label.close +
    printList(
      val,
      indent,
      prevIndent,
      spacing,
      edgeSpacing,
      refs,
      maxDepth,
      currentDepth,
      plugins,
      min,
      callToJSON,
      printFunctionName,
      escapeRegex,
      colors
    )
  )
}

function printArray(
  val,
  indent,
  prevIndent,
  spacing,
  edgeSpacing,
  refs,
  maxDepth,
  currentDepth,
  plugins,
  min,
  callToJSON,
  printFunctionName,
  escapeRegex,
  colors
) {
  return (
    colors.label.open +
    (min ? '' : val.constructor.name + ' ') +
    colors.label.close +
    printList(
      val,
      indent,
      prevIndent,
      spacing,
      edgeSpacing,
      refs,
      maxDepth,
      currentDepth,
      plugins,
      min,
      callToJSON,
      printFunctionName,
      escapeRegex,
      colors
    )
  )
}

function printKey(
  key,
  indent,
  prevIndent,
  spacing,
  edgeSpacing,
  refs,
  maxDepth,
  currentDepth,
  plugins,
  min,
  callToJSON,
  printFunctionName,
  escapeRegex,
  colors
) {
  const typeOf = typeof key
  if (typeOf === 'string') {
    if (keyword.isIdentifierNameES6(key, true))
      return colors.key.open + key + colors.key.close
    if (/^\d+$/.test(key)) return colors.key.open + key + colors.key.close
    return colors.key.open + '"' + printString(key) + '"' + colors.key.close
  }
  if (typeOf === 'symbol')
    return colors.key.open + printSymbol(key) + colors.key.close

  return print(
    key,
    indent,
    prevIndent,
    spacing,
    edgeSpacing,
    refs,
    maxDepth,
    currentDepth,
    plugins,
    min,
    callToJSON,
    printFunctionName,
    escapeRegex,
    colors
  )
}

function printMap(
  val,
  indent,
  prevIndent,
  spacing,
  edgeSpacing,
  refs,
  maxDepth,
  currentDepth,
  plugins,
  min,
  callToJSON,
  printFunctionName,
  escapeRegex,
  colors
) {
  let result =
    colors.label.open +
    'Map ' +
    colors.label.close +
    colors.bracket.open +
    '{' +
    colors.bracket.close
  const iterator = val.entries()
  let current = iterator.next()

  if (!current.done) {
    result += edgeSpacing

    const innerIndent = prevIndent + indent

    while (!current.done) {
      const key = printKey(
        current.value[0],
        indent,
        innerIndent,
        spacing,
        edgeSpacing,
        refs,
        maxDepth,
        currentDepth,
        plugins,
        min,
        callToJSON,
        printFunctionName,
        escapeRegex,
        colors
      )
      const value = print(
        current.value[1],
        indent,
        innerIndent,
        spacing,
        edgeSpacing,
        refs,
        maxDepth,
        currentDepth,
        plugins,
        min,
        callToJSON,
        printFunctionName,
        escapeRegex,
        colors
      )

      result += innerIndent + key + ' => ' + value

      current = iterator.next()

      if (!current.done) {
        result += colors.comma.open + ',' + colors.comma.close + spacing
      }
    }

    result +=
      (min ? '' : colors.comma.open + ',' + colors.comma.close) +
      edgeSpacing +
      prevIndent
  }

  return result + colors.bracket.open + '}' + colors.bracket.close
}

function printObject(
  val,
  indent,
  prevIndent,
  spacing,
  edgeSpacing,
  refs,
  maxDepth,
  currentDepth,
  plugins,
  min,
  callToJSON,
  printFunctionName,
  escapeRegex,
  colors
) {
  const constructor = min ?
    '' :
    val.constructor ? val.constructor.name + ' ' : 'Object '
  let result =
    colors.label.open +
    constructor +
    colors.label.close +
    colors.bracket.open +
    '{' +
    colors.bracket.close
  let keys = Object.keys(val).sort()
  const symbols = getSymbols(val)

  if (symbols.length) {
    keys = keys
      .filter(
        key =>
          !(typeof key === 'symbol' || toString.call(key) === '[object Symbol]')
      )
      .concat(symbols)
  }

  if (keys.length) {
    result += edgeSpacing

    const innerIndent = prevIndent + indent

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const name = printKey(
        key,
        indent,
        innerIndent,
        spacing,
        edgeSpacing,
        refs,
        maxDepth,
        currentDepth,
        plugins,
        min,
        callToJSON,
        printFunctionName,
        escapeRegex,
        colors
      )
      const value = print(
        val[key],
        indent,
        innerIndent,
        spacing,
        edgeSpacing,
        refs,
        maxDepth,
        currentDepth,
        plugins,
        min,
        callToJSON,
        printFunctionName,
        escapeRegex,
        colors
      )

      result += innerIndent + name + ': ' + value

      if (i < keys.length - 1) {
        result += colors.comma.open + ',' + colors.comma.close + spacing
      }
    }

    result +=
      (min ? '' : colors.comma.open + ',' + colors.comma.close) +
      edgeSpacing +
      prevIndent
  }

  return result + colors.bracket.open + '}' + colors.bracket.close
}

function printSet(
  val,
  indent,
  prevIndent,
  spacing,
  edgeSpacing,
  refs,
  maxDepth,
  currentDepth,
  plugins,
  min,
  callToJSON,
  printFunctionName,
  escapeRegex,
  colors
) {
  let result =
    colors.label.open +
    'Set ' +
    colors.label.close +
    colors.bracket.open +
    '{' +
    colors.bracket.close
  const iterator = val.entries()
  let current = iterator.next()

  if (!current.done) {
    result += edgeSpacing

    const innerIndent = prevIndent + indent

    while (!current.done) {
      result +=
        innerIndent +
        print(
          current.value[1],
          indent,
          innerIndent,
          spacing,
          edgeSpacing,
          refs,
          maxDepth,
          currentDepth,
          plugins,
          min,
          callToJSON,
          printFunctionName,
          escapeRegex,
          colors
        )

      current = iterator.next()

      if (!current.done) {
        result += colors.comma.open + ',' + colors.comma.close + spacing
      }
    }

    result +=
      (min ? '' : colors.comma.open + ',' + colors.comma.close) +
      edgeSpacing +
      prevIndent
  }

  return result + colors.bracket.open + '}' + colors.bracket.close
}

function printComplexValue(
  val,
  indent,
  prevIndent,
  spacing,
  edgeSpacing,
  refs,
  maxDepth,
  currentDepth,
  plugins,
  min,
  callToJSON,
  printFunctionName,
  escapeRegex,
  colors
) {
  refs = refs.slice()
  if (refs.indexOf(val) > -1) {
    return '[Circular]'
  }
  else {
    refs.push(val)
  }

  currentDepth++

  const hitMaxDepth = currentDepth > maxDepth

  if (
    callToJSON &&
    !hitMaxDepth &&
    val.toJSON &&
    typeof val.toJSON === 'function'
  ) {
    return print(
      val.toJSON(),
      indent,
      prevIndent,
      spacing,
      edgeSpacing,
      refs,
      maxDepth,
      currentDepth,
      plugins,
      min,
      callToJSON,
      printFunctionName,
      escapeRegex,
      colors
    )
  }

  const toStringed = toString.call(val)
  if (toStringed === '[object Arguments]') {
    return hitMaxDepth ?
      '[Arguments]' :
      printArguments(
          val,
          indent,
          prevIndent,
          spacing,
          edgeSpacing,
          refs,
          maxDepth,
          currentDepth,
          plugins,
          min,
          callToJSON,
          printFunctionName,
          escapeRegex,
          colors
        )
  }
  else if (isToStringedArrayType(toStringed)) {
    return hitMaxDepth ?
      '[Array]' :
      printArray(
          val,
          indent,
          prevIndent,
          spacing,
          edgeSpacing,
          refs,
          maxDepth,
          currentDepth,
          plugins,
          min,
          callToJSON,
          printFunctionName,
          escapeRegex,
          colors
        )
  }
  else if (toStringed === '[object Map]') {
    return hitMaxDepth ?
      '[Map]' :
      printMap(
          val,
          indent,
          prevIndent,
          spacing,
          edgeSpacing,
          refs,
          maxDepth,
          currentDepth,
          plugins,
          min,
          callToJSON,
          printFunctionName,
          escapeRegex,
          colors
        )
  }
  else if (toStringed === '[object Set]') {
    return hitMaxDepth ?
      '[Set]' :
      printSet(
          val,
          indent,
          prevIndent,
          spacing,
          edgeSpacing,
          refs,
          maxDepth,
          currentDepth,
          plugins,
          min,
          callToJSON,
          printFunctionName,
          escapeRegex,
          colors
        )
  }
  else if (typeof val === 'object') {
    return hitMaxDepth ?
      '[Object]' :
      printObject(
          val,
          indent,
          prevIndent,
          spacing,
          edgeSpacing,
          refs,
          maxDepth,
          currentDepth,
          plugins,
          min,
          callToJSON,
          printFunctionName,
          escapeRegex,
          colors
        )
  }
}

function printPlugin(
  val,
  indent,
  prevIndent,
  spacing,
  edgeSpacing,
  refs,
  maxDepth,
  currentDepth,
  plugins,
  min,
  callToJSON,
  printFunctionName,
  escapeRegex,
  colors
) {
  let match = false
  let plugin

  for (let p = 0; p < plugins.length; p++) {
    plugin = plugins[p]

    if (plugin.test(val)) {
      match = true
      break
    }
  }

  if (!match) {
    return false
  }

  function boundPrint(val) {
    return print(
      val,
      indent,
      prevIndent,
      spacing,
      edgeSpacing,
      refs,
      maxDepth,
      currentDepth,
      plugins,
      min,
      callToJSON,
      printFunctionName,
      escapeRegex,
      colors
    )
  }

  function boundIndent(str) {
    const indentation = prevIndent + indent
    return indentation + str.replace(NEWLINE_REGEXP, '\n' + indentation)
  }

  const opts = {
    edgeSpacing,
    spacing,
  }
  return plugin.print(val, boundPrint, boundIndent, opts, colors)
}

function print(
  val,
  indent,
  prevIndent,
  spacing,
  edgeSpacing,
  refs,
  maxDepth,
  currentDepth,
  plugins,
  min,
  callToJSON,
  printFunctionName,
  escapeRegex,
  colors
) {
  const basic = printBasicValue(val, printFunctionName, escapeRegex, colors)
  if (basic) return basic

  const plugin = printPlugin(
    val,
    indent,
    prevIndent,
    spacing,
    edgeSpacing,
    refs,
    maxDepth,
    currentDepth,
    plugins,
    min,
    callToJSON,
    printFunctionName,
    escapeRegex,
    colors
  )
  if (plugin) return plugin

  return printComplexValue(
    val,
    indent,
    prevIndent,
    spacing,
    edgeSpacing,
    refs,
    maxDepth,
    currentDepth,
    plugins,
    min,
    callToJSON,
    printFunctionName,
    escapeRegex,
    colors
  )
}

const DEFAULTS = {
  callToJSON: true,
  indent: 2,
  maxDepth: Infinity,
  min: false,
  plugins: [],
  printFunctionName: true,
  escapeRegex: false,
  highlight: false,
  theme: {
    tag: 'cyan',
    content: 'reset',
    prop: 'yellow',
    value: 'green',
    number: 'yellow',
    string: 'red',
    date: 'red',
    symbol: 'red',
    regex: 'red',
    function: 'blue',
    error: 'red',
    boolean: 'yellow',
    label: 'blue',
    bracket: 'grey',
    comma: 'grey',
    misc: 'grey',
    key: 'reset',
  },
}

function validateOptions(opts) {
  Object.keys(opts).forEach(key => {
    if (!DEFAULTS.hasOwnProperty(key)) {
      throw new Error('prettyFormat: Invalid option: ' + key)
    }
  })

  if (opts.min && opts.indent !== undefined && opts.indent !== 0) {
    throw new Error('prettyFormat: Cannot run with min option and indent')
  }
}

function normalizeOptions(opts) {
  const result = {}

  Object.keys(DEFAULTS).forEach(
    key => (result[key] = opts.hasOwnProperty(key) ? opts[key] : DEFAULTS[key])
  )

  if (result.min) {
    result.indent = 0
  }

  return result
}

function createIndent(indent) {
  return new Array(indent + 1).join(' ')
}

function prettyFormat(val, opts) {
  if (!opts) {
    opts = DEFAULTS
  }
  else {
    validateOptions(opts)
    opts = normalizeOptions(opts)
  }

  let colors = {}
  Object.keys(opts.theme).forEach(key => {
    if (opts.highlight) {
      colors[key] = style[opts.theme[key]]
    }
    else {
      colors[key] = {open: '', close: ''}
    }
  })

  let indent
  let refs
  const prevIndent = ''
  const currentDepth = 0
  const spacing = opts.min ? ' ' : '\n'
  const edgeSpacing = opts.min ? '' : '\n'

  if (opts && opts.plugins.length) {
    indent = createIndent(opts.indent)
    refs = []
    var pluginsResult = printPlugin(
      val,
      indent,
      prevIndent,
      spacing,
      edgeSpacing,
      refs,
      opts.maxDepth,
      currentDepth,
      opts.plugins,
      opts.min,
      opts.callToJSON,
      opts.printFunctionName,
      opts.escapeRegex,
      colors
    )
    if (pluginsResult) return pluginsResult
  }

  var basicResult = printBasicValue(
    val,
    opts.printFunctionName,
    opts.escapeRegex,
    colors
  )
  if (basicResult) return basicResult

  if (!indent) indent = createIndent(opts.indent)
  if (!refs) refs = []
  return printComplexValue(
    val,
    indent,
    prevIndent,
    spacing,
    edgeSpacing,
    refs,
    opts.maxDepth,
    currentDepth,
    opts.plugins,
    opts.min,
    opts.callToJSON,
    opts.printFunctionName,
    opts.escapeRegex,
    colors
  )
}

module.exports = prettyFormat
