// https://github.com/avajs/ava/blob/146c3e25df31d39165b4ad99f4d523e7806c30fb/lib/format-assert-error.js#L6
const prettyFormat = require('../pretty-format')
const chalk = require('../chalk')
const diff = require('../diff')
const DiffMatchPatch = require('../diff-match-patch')
const indentString = require('../indent-string')

function formatValue(value, options) {
  return prettyFormat(
    value,
    Object.assign(
      {
        callToJSON: false,
        highlight: true,
      },
      options
    )
  )
}

const cleanUp = line => {
  if (line[0] === '+') {
    return `${chalk.green('+')} ${line.slice(1)}`
  }

  if (line[0] === '-') {
    return `${chalk.red('-')} ${line.slice(1)}`
  }

  if (line.match(/@@/)) {
    return null
  }

  if (line.match(/\\ No newline/)) {
    return null
  }

  return ` ${line}`
}

const getType = value => {
  const type = typeof value
  if (type === 'object') {
    if (type === null) {
      return 'null'
    }
    if (Array.isArray(value)) {
      return 'array'
    }
  }
  return type
}

function formatDiff(actual, expected, hack = false) {
  const actualType = getType(actual)
  const expectedType = getType(expected)
  if (actualType !== expectedType) {
    return null
  }

  if (actualType === 'array' || actualType === 'object') {
    const formatted = diff
      .createPatch('string', formatValue(actual), formatValue(expected))
      .split('\n')
      .slice(4)
      .map(cleanUp)
      .filter(Boolean)
      .join('\n')
      .trimRight()

    return formatted
    return {label: 'Difference:', formatted}
  }

  if (actualType === 'string') {
    const formatted = new DiffMatchPatch()
      .diff_main(
        formatValue(actual, {highlight: false}),
        formatValue(expected, {highlight: false})
      )
      .map(part => {
        if (part[0] === 1) {
          if (hack === false) return chalk.bgGreen.black(part[1])
          const noSpaces = part[1].replace(/[\s]/gim, '')
          // const eh = noSpaces
          // console.log({eh})
          const diff1 = chalk.bgGreen.black(noSpaces)
          let first = true
          return part[1].replace(/[\S]/gim, match => {
            if (first === true) {
              first = false
              return diff1
            }
            return ''
          })
        }

        if (part[0] === -1) {
          return chalk.bgRed.black(part[1])
        }

        return chalk.blue(part[1])
      })
      .join('')
      .trimRight()

    return formatted
    return {label: 'Difference:', formatted}
  }

  return null
}

function formatWithLabel(label, value) {
  return {label, formatted: formatValue(value)}
}

function formatSerializedError(error) {
  if (error.statements.length === 0 && error.values.length === 0) {
    return null
  }

  let result = error.values
    .map(
      value =>
        `${value.label}\n\n${indentString(value.formatted, 2).trimRight()}\n`
    )
    .join('\n')

  if (error.statements.length > 0) {
    if (error.values.length > 0) {
      result += '\n'
    }

    result += error.statements
      .map(
        statement => `${statement[0]}\n${chalk.grey('=>')} ${statement[1]}\n`
      )
      .join('\n')
  }

  return result
}

formatDiff.formatSerializedError = formatSerializedError
formatDiff.formatWithLabel = formatWithLabel
formatDiff.formatDiff = formatDiff
formatDiff.formatValue = formatValue

function diffs(current, last, hack = false) {
  // obj, hack = true
  // const state = obj || this.getSnapshot('ast', 2)
  // const last = this.getSnapshot('ast')

  // const prettyState = indentString(state).replace(/[']/gim, '')
  // const prettyLast = indentString(last).replace(/[']/gim, '')
  // let prettyState = state.replace(/[']/gim, '')
  // let prettyLast = last.replace(/[']/gim, '')
  // prettyState = indentString(state).replace(/[']/gim, '').replace(',', '\n')
  // prettyLast = indentString(last).replace(/[']/gim, '').replace(',', '\n')

  // require('fliplog').quick(generate(state))
  // require('fliplog').quick({state, last, t: this})
  return formatDiff(current, last, hack)
}

diffs.diffs = diffs
diffs.diff = diffs
exports = module.exports = diffs
