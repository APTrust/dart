const toS = require('./toS')
const isPureObj = require('./pureObj')
const isRegExp = require('./regexp')
const isError = require('./error')
const isBoolean = require('./boolean')
const isNumber = require('./number')
const isString = require('./string')
const isDate = require('./date')
const isObjWithKeys = require('./objWithKeys')
const isReal = require('./real')
const isMap = require('./map')
const isSet = require('./set')
const isSymbol = require('./symbol')
const isFunction = require('./function')
const isObj = require('./obj')
const isClass = require('./class')

const isArray = Array.isArray
const objectKeys = Object.keys
const hasOwnProperty = (x, y) => Object.hasOwnProperty.call(x, y)

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
