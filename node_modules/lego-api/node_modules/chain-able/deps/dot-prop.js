// https://github.com/sindresorhus/dot-prop/blob/master/index.js
// https://github.com/sindresorhus/is-obj/blob/master/index.js
const isObj = require('./is/obj')
const getPathSegments = require('./dot-segments')

module.exports = {
  get(obj, path, value) {
    if (!isObj(obj) || typeof path !== 'string') {
      return value === undefined ? obj : value
    }

    const pathArr = getPathSegments(path)

    for (let i = 0; i < pathArr.length; i++) {
      if (!Object.prototype.propertyIsEnumerable.call(obj, pathArr[i])) {
        return value
      }

      obj = obj[pathArr[i]]

      if (obj === undefined || obj === null) {
        // `obj` is either `undefined` or `null` so we want to stop the loop, and
        // if this is not the last bit of the path, and
        // if it did't return `undefined`
        // it would return `null` if `obj` is `null`
        // but we want `get({foo: null}, 'foo.bar')` to equal `undefined`, or the supplied value, not `null`
        if (i !== pathArr.length - 1) {
          return value
        }

        break
      }
    }

    return obj
  },

  set(obj, path, value) {
    let full = obj
    if (!isObj(obj) || typeof path !== 'string') {
      return obj
    }

    const pathArr = getPathSegments(path)

    for (let i = 0; i < pathArr.length; i++) {
      const p = pathArr[i]

      if (!isObj(obj[p])) {
        obj[p] = {}
      }

      if (i === pathArr.length - 1) {
        obj[p] = value
      }

      obj = obj[p]
    }
  },

  delete(obj, path) {
    let full = obj
    if (!isObj(obj) || typeof path !== 'string') {
      return obj
    }

    const pathArr = getPathSegments(path)

    for (let i = 0; i < pathArr.length; i++) {
      const p = pathArr[i]

      if (i === pathArr.length - 1) {
        delete obj[p]
        return
      }

      obj = obj[p]

      if (!isObj(obj)) {
        return
      }
    }
  },

  has(obj, path) {
    if (!isObj(obj) || typeof path !== 'string') {
      return false
    }

    const pathArr = getPathSegments(path)

    for (let i = 0; i < pathArr.length; i++) {
      if (isObj(obj)) {
        if (!(pathArr[i] in obj)) {
          return false
        }

        obj = obj[pathArr[i]]
      }
      else {
        return false
      }
    }

    return true
  },
}
