/* prettier-ignore */
function allKeys(obj, symbols = true) {
  return Object
    .getOwnPropertyNames(obj)
    // .concat(symbols === true ? Object.getOwnPropertySymbols(obj) : [])
    .concat(Object.getOwnPropertySymbols(obj))
}

/**
 * @since  1.0.2
 * @desc   get properties of an object for easy safe configurable key vals
 * @param  {Object} obj
 * @param  {null | Object} [o=null]
 * @return {Object | Array} chain object, or array/object of the properties
 */
function chain(obj, o = null) {
  const props = {}
  let opts = {symbols: true, descriptors: true, withProto: true}

  props.symbols = use => {
    opts.symbols = use
    return props
  }
  props.withProto = () => {
    opts.withProto = true
    return props
  }
  props.asObj = () => {
    opts.obj = true
    return props
  }
  props.descriptors = () => {
    opts.descriptors = true
    return props
  }
  props.get = () => {
    const s = opts.symbols
    const d = opts.withDescriptor
    let keys = allKeys(obj, s)
    if (opts.withProto === true) {
      keys = keys.concat(Object.getPrototypeOf(obj), s)
    }
    if (opts.obj === true) {
      return keys.map(key => ({
        [key]: d ? Object.getOwnPropertyDescriptor(obj, key) : key,
      }))
    }

    /* prettier-ignore */
    return keys
      .map(key => d ? Object.getOwnPropertyDescriptor(obj, key) : key)
  }

  if (o !== null) {
    opts = Object.assign(opts, o)
    return props.get()
  }

  return props
}

/**
 * @since  1.0.2
 * @param  {Object} obj
 * @param  {null | Object} [o={}]
 * @return {Array}
 */
function allProps(obj, o = {}) {
  return chain(obj, o)
}

allProps.chain = chain
allProps.keys = allKeys

module.exports = allProps
