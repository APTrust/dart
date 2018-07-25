'use strict'

module.exports = sort

var severities = {
  true: 2,
  false: 1,
  null: 0,
  undefined: 0
}

function sort(file) {
  file.messages.sort(comparator)
  return file
}

function comparator(a, b) {
  var left = severities[a.fatal]
  var right = severities[b.fatal]
  return check(a, b, 'line') || check(a, b, 'column') || right - left || -1
}

function check(a, b, property) {
  return (a[property] || 0) - (b[property] || 0)
}
