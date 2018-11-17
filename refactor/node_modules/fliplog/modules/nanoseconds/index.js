/*!
 * https://github.com/jonschlinkert/nanoseconds/blob/master/index.js
 * nanoseconds <https://github.com/jonschlinkert/nanoseconds>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

module.exports = function nanoseconds(time) {
  if (!Array.isArray(time) || time.length !== 2) {
    throw new TypeError('expected an array from process.hrtime()')
  }
  return +time[0] * 1e9 + +time[1]
}
