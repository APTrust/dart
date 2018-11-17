const indentString = require('../indent-string')
const longest = require('../longest')

// https://github.com/kevva/lpad-align/blob/master/index.js
module.exports = function lpadalign(str, arr, indent) {
  if (typeof str !== 'string') {
    throw new TypeError(`Expected a \`string\`, got \`${typeof str}\``)
  }

  if (!Array.isArray(arr)) {
    throw new TypeError(`Expected an \`Array\`, got \`${typeof arr}\``)
  }

  return indentString(str, (indent || 0) + longest(arr).length - str.length)
}
