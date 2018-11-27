// https://www.bennadel.com/blog/2829-string-interpolation-using-util-format-and-util-inspect-in-node-js.htm
const filter = [
  'helpers',
  'addDebug',
  'inspect',
  'emit',
  'on',
  'debugFor',
  'translator',
  'appsByName',

  // these ones we might want to toggle on and off
  'instance',
  'api',
  'evts',
  'hubs',
]
const inspectorGadget = (thisArg, moreFilters) => {
  return function(depth, options) {
    let toInspect = Object.keys(thisArg)
    .filter(key => !filter.includes(key))

    if (Array.isArray(moreFilters))
      toInspect = toInspect.filter(key => !moreFilters.includes(key))
    // else if (typeof moreFilters === 'function')
    //   toInspect = toInspect.map(key => moreFilters(key, this[key]))
    else if (typeof moreFilters === 'object') {
      // if (moreFilters.blacklist)
      if (moreFilters.whitelist) {
        toInspect = toInspect.filter(key => moreFilters.whitelist.includes(key))
      }
      // if (moreFilters.val) {
      //   return moreFilters.val
      // }
      // if (moreFilters.filter)
      // if (moreFilters.map)
    }

    let inspected = {}
    toInspect.forEach(key => {
      // @TODO: filter out .length on function...
      // let val = thisArg[key]
      // if (typeof val === 'function')
      inspected[key] = thisArg[key]
    })
    return inspected
  }
}

module.exports = inspectorGadget
