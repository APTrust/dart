// https://github.com/sindresorhus/is-obj/blob/master/index.js
function isPureObj(x) {
  var type = typeof x
  return x !== null && type === 'object'
}

function isObj(x) {
  return isPureObj(x) || typeof x === 'function'
}

const isClass = o => (/^\s*class\s/).test(o.toString())

// Object.prototype.toString.call(val) === '[object Object]' &&
const isObjWithKeys = val => isObj(val) && Object.keys(val).length === 0

function toS(obj) {
  return Object.prototype.toString.call(obj)
}
function isDate(obj) {
  return obj instanceof Date || toS(obj) === '[object Date]'
}
function isRegExp(obj) {
  return obj instanceof RegExp || toS(obj) === '[object RegExp]'
}
function isError(obj) {
  return obj instanceof Error || toS(obj) === '[object Error]'
}
function isBoolean(obj) {
  return obj === true || obj === false || toS(obj) === '[object Boolean]'
}
function isNumber(obj) {
  return (
    toS(obj) === '[object Number]' ||
    (/^0x[0-9a-f]+$/i).test(obj) ||
    (/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/).test(obj)
  )
}
function isString(obj) {
  return typeof obj === 'string' || toS(obj) === '[object String]'
}
function isMap(obj) {
  return obj instanceof Map || toS(obj) === '[object Map]'
}
function isSet(obj) {
  return obj instanceof Set || toS(obj) === '[object Set]'
}
function isSymbol(obj) {
  return toS(obj) === '[object Symbol]'
}
function isReal(x) {
  return x !== null && x !== undefined && !isNaN(x)
}
// function isArguments(x) {
//   return toS(x) === '[object Arguments]'
// }
function isFunction(x) {
  return typeof x === 'function'
}

var objectKeys = Object.keys

var isArray = Array.isArray

var hasOwnProperty = Object.hasOwnProperty

module.exports = {
  isObjWithKeys,
  // isArguments,
  isObj,
  isFunction,
  isReal,
  isPureObj,
  isClass,
  toS,
  isDate,
  isRegExp,
  isError,
  isBoolean,
  isNumber,
  isString,
  isMap,
  isSet,
  isSymbol,
  objectKeys,
  isArray,
  hasOwnProperty,
}
