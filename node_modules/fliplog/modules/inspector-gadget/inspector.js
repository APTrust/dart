const inspector = (msg, depth = 30, opts = {}) => {
  // allow taking in different depths
  if (!Number.isInteger(depth)) depth = 10
  const defaults = {
    depth,
    maxArrayLength: depth,
    showHidden: true,
    showProxy: true,
    colors: true,
  }
  opts = Object.assign(defaults, opts)

  const util = require('util')
  try {
    const inspected = util.inspect(msg, opts)
    return inspected
  }
  catch (e) {
    console.log(e)
    try {
      const stringify = require('../javascript-stringify')
      const stringified = stringify(msg, null, '  ')
      return stringified
    }
    catch (error) {
      return msg
    }
  }
}

module.exports = inspector
