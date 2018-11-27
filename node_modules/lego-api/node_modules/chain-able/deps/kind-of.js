// https://www.npmjs.com/package/kind-of
var toString = Object.prototype.toString

/**
 * @desc Get the native `typeof` a value.
 * @param  {any} val
 * @return {string} Native javascript type
 */
module.exports = function kindOf(val) {
  const vtypeof = typeof val

  // primitivies
  if (vtypeof === 'undefined') {
    return 'undefined'
  }
  if (val === null) {
    return 'null'
  }
  if (val === true || val === false || val instanceof Boolean) {
    return 'boolean'
  }
  if (vtypeof === 'string' || val instanceof String) {
    return 'string'
  }
  if (vtypeof === 'number' || val instanceof Number) {
    return 'number'
  }
  // functions
  if (vtypeof === 'function' || val instanceof Function) {
    return 'function'
  }

  // array
  if (typeof Array.isArray !== 'undefined' && Array.isArray(val)) {
    return 'array'
  }

  // check for instances of RegExp and Date before calling `toString`
  if (val instanceof RegExp) {
    return 'regexp'
  }
  if (val instanceof Date) {
    return 'date'
  }

  if (val instanceof Set) {
    return 'set'
  }
  if (val instanceof Map) {
    return 'map'
  }

  // other objects
  var type = toString.call(val)

  if (type === '[object RegExp]') {
    return 'regexp'
  }
  if (type === '[object Date]') {
    return 'date'
  }
  if (type === '[object Arguments]') {
    return 'arguments'
  }
  if (type === '[object Error]') {
    return 'error'
  }
  if (type === '[object Promise]') {
    return 'promise'
  }

  // buffer
  if (
    val != null &&
    !!val.constructor &&
    typeof val.constructor.isBuffer === 'function' &&
    val.constructor.isBuffer(val)
  ) {
    return 'buffer'
  }

  // es6: Map, WeakMap, Set, WeakSet
  if (type === '[object WeakSet]') {
    return 'weakset'
  }
  if (type === '[object WeakMap]') {
    return 'weakmap'
  }
  if (type === '[object Symbol]') {
    return 'symbol'
  }

  // typed arrays
  if (type.includes('Array') === true) {
    return type
      .replace('[', '')
      .replace(']', '')
      .replace('object ', '')
      .toLowerCase()
  }

  // must be a plain object
  return 'object'
}
