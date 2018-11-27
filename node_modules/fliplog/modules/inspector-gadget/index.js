const util = require('util')
const inspector = require('./inspector')
const inspectorGadget = require('./inspector-gadget')
const cleaner = require('./cleaner')

// for compatibility with nodejs + web
let custom = function noop() {}
if (util) {
  custom = util.inspect.defaultOptions.customInspect
}

module.exports = {
  cleaner,
  util,
  inspectorGadget,
  inspector,
  inspect: inspector,
  custom: (arg = false) => {
    if (arg !== true && arg !== false && arg !== null && arg !== undefined) {
      util.inspect.defaultOptions.customInspect = arg
    }
    else if (arg) {
      util.inspect.defaultOptions.customInspect = custom
    }
    else {
      util.inspect.defaultOptions.customInspect = false
    }
    return inspector
  },
}
