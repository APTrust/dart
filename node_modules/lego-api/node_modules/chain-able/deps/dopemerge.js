const isPureObj = require('./is/pureObj')
const isArray = require('./is/array')
const toS = require('./is/toS')

const ezType = x => (isArray(x) ? 'array' : typeof x)

// @TODO convert forEach for faster loops
function isMergeableObj(val) {
  return (
    // not null object
    isPureObj(val) &&
    // object toString is not a date or regex
    !['[object RegExp]', '[object Date]'].includes(toS(val))
  )
}

function emptyTarget(val) {
  return isArray(val) ? [] : {}
}
function cloneIfNeeded(value, optsArg) {
  return optsArg.clone === true && isMergeableObj(value)
    ? deepmerge(emptyTarget(value), value, optsArg)
    : value
}

function defaultArrayMerge(target, source, optsArg) {
  var destination = target.slice()
  source.forEach((v, i) => {
    if (typeof destination[i] === 'undefined') {
      destination[i] = cloneIfNeeded(v, optsArg)
    }
    else if (isMergeableObj(v)) {
      destination[i] = deepmerge(target[i], v, optsArg)
    }
    else if (target.indexOf(v) === -1) {
      destination.push(cloneIfNeeded(v, optsArg))
    }
  })
  return destination
}

function mergeObj(target, source, optsArg) {
  var destination = {}
  if (isMergeableObj(target)) {
    Object.keys(target).forEach(key => {
      destination[key] = cloneIfNeeded(target[key], optsArg)
    })
  }
  Object.keys(source).forEach(key => {
    if (!isMergeableObj(source[key]) || !target[key]) {
      destination[key] = cloneIfNeeded(source[key], optsArg)
    }
    else {
      destination[key] = deepmerge(target[key], source[key], optsArg)
    }
  })
  return destination
}

function deepmerge(target, source, optsArg) {
  if (isArray(source)) {
    const {arrayMerge} = optsArg
    return isArray(target)
      ? arrayMerge(target, source, optsArg)
      : cloneIfNeeded(source, optsArg)
  }

  // else
  return mergeObj(target, source, optsArg)
}

// unused
// @TODO options for merging arr, and on any type combo
// const todoOpts = {
//   // when: { left(cb), right(cb) }
//   // whenLeft(cb): {}
//   objToArr: false, // not implemented
//   stringConcat: false, // not implemented
//   numberOperation: "+ * ^ toarr cb",
//   promises... wait until finished then call merge???
//   boolPrefer: 0, 1, true, false
// }

function eqq(arr1, arr2) {
  return arr1[0] === arr2[0] && arr1[1] === arr2[1]
}

function eqCurry(types) {
  return eqq.bind(null, types)
}

function getDefaults() {
  return {
    arrayMerge: defaultArrayMerge,
    stringToArray: true,
    boolToArray: false,
    boolAsRight: true,
    ignoreTypes: ['null', 'undefined', 'NaN'],
    debug: true,
  }
}

// eslint-disable-next-line complexity
function dopemerge(obj1, obj2, opts = {}) {
  // if they are identical, fastest === check
  if (obj1 === obj2) return obj1

  // setup options
  const options = Object.assign(getDefaults(), opts)
  const {ignoreTypes, stringToArray, boolToArray, clone} = options

  const types = [ezType(obj1), ezType(obj2)]

  // check one then check the other
  // @TODO might want to push undefined null nan into array but...
  if (ignoreTypes.includes(types[0]) === true) return obj2
  if (ignoreTypes.includes(types[1]) === true) return obj1

  const eq = eqCurry(types)

  // check types to prefer
  switch (true) {
    case eq(['boolean', 'boolean']): {
      return boolToArray ? [obj1, obj2] : obj2
    }
    case eq(['string', 'string']): {
      return stringToArray ? [obj1, obj2] : obj1 + obj2
    }
    case eq(['array', 'string']): {
      return (clone ? obj1.slice(0) : obj1).concat([obj2])
    }
    case eq(['string', 'array']): {
      return (clone ? obj2.slice(0) : obj2).concat([obj1])
    }
    default: {
      return deepmerge(obj1, obj2, options)
    }
  }
}

module.exports = dopemerge
