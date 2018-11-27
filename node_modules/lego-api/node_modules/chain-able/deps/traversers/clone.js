const eq = require('./eq')
const traverse = require('../traverse')
const dot = require('../dot-prop')
const {
  isObjWithKeys,
  isObj,
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
} = require('../is')

function cloneValue(src) {
  let dst = null

  // switch (true) {
  //   case !isReal(src): return src
  //   case isArray(src): return src.slice(0).map(val => {
  //     return traverse(val).map(xx => clone(xx))
  //   })
  //   case isDate(src):
  // }

  if (!isReal(src)) {
    return src
  }
  if (isArray(src)) {
    return src.slice(0).map(val => {
      return traverse(val).map(xx => clone(xx))
    })
  }
  if (isDate(src)) {
    return new Date(src.getTime ? src.getTime() : src)
  }
  if (isRegExp(src)) {
    return new RegExp(src)
  }
  if (isError(src)) {
    dst = new Error(src.message)
    dst.stack = src.stack
    return dst
  }
  if (isBoolean(src)) {
    return new Boolean(src)
  }
  if (isNumber(src)) {
    return new Number(src)
  }
  if (isString(src)) {
    return new String(src)
  }
  if (isObj(src)) {
    return clone(src)
  }
  if (Object.create && Object.getPrototypeOf) {
    return Object.create(Object.getPrototypeOf(src))
  }
  if (src.constructor === Object) {
    return {}
  }

  // @NOTE: else
  // @NOTE: only happens if above getPrototypeOf does not exist
  var proto = (src.constructor && src.constructor.prototype) ||
  src.__proto__ || {}
  var T = function() {}
  T.prototype = proto
  dst = new T()
  traverse(src).forEach(objectKeys(src), key => {
    dst[key] = clone(src[key])
  })
  return dst
}

function clone(obj) {
  console.log('cloning: ', obj)
  const cloned = {}

  // same as
  // return require('lodash').cloneDeep(obj)
  // return require('immutable').fromJS(obj).toJS()
  traverse(obj).forEach(function(x) {
    var src = x
    var dst = cloneValue(src)
    const path = this.path.join('.')
    if (path === '') {
      // src = dst
    }
    else {
      require('fliplog').dim(path).data({dst, x, obj}).echo()
      console.log('\n')

      if (!isObj(dst)) {
        dot.set(cloned, path, dst)
      }
      else {
        // if it is an object, use an empty obj
        // require('fliplog').bold(path).data({dst, x, obj}).echo()
        dot.set(cloned, path, {})
      }

      // dot.set(cloned, path, dst)
    }
  })
  return cloned
}

module.exports = clone
