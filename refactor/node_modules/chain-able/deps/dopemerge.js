let _debug = true

// @TODO convert forEach for faster loops
// import deepmerge from 'deepmerge'
function isMergeableObject(val) {
  var strType = Object.prototype.toString.call(val)

  return (
    // not null object
    val !== null &&
    typeof val === 'object' &&
    // object toString is not a date or regex
    strType !== '[object RegExp]' &&
    strType !== '[object Date]'
  )
}

function emptyTarget(val) {
  return Array.isArray(val) ? [] : {}
}

function cloneIfNecessary(value, optionsArgument) {
  var clone = optionsArgument && optionsArgument.clone === true
  return clone && isMergeableObject(value) ?
    deepmerge(emptyTarget(value), value, optionsArgument) :
    value
}

function defaultArrayMerge(target, source, optionsArgument) {
  var destination = target.slice()
  source.forEach((e, i) => {
    if (typeof destination[i] === 'undefined') {
      destination[i] = cloneIfNecessary(e, optionsArgument)
    }
    else if (isMergeableObject(e)) {
      destination[i] = deepmerge(target[i], e, optionsArgument)
    }
    else if (target.indexOf(e) === -1) {
      destination.push(cloneIfNecessary(e, optionsArgument))
    }
  })
  return destination
}

function mergeObject(target, source, optionsArgument) {
  var destination = {}
  if (isMergeableObject(target)) {
    Object.keys(target).forEach(key => {
      destination[key] = cloneIfNecessary(target[key], optionsArgument)
    })
  }
  Object.keys(source).forEach(key => {
    if (!isMergeableObject(source[key]) || !target[key]) {
      destination[key] = cloneIfNecessary(source[key], optionsArgument)
    }
    else {
      destination[key] = deepmerge(target[key], source[key], optionsArgument)
    }
  })
  return destination
}

function deepmerge(target, source, optionsArgument) {
  var array = Array.isArray(source)
  var options = optionsArgument || {arrayMerge: defaultArrayMerge}
  var arrayMerge = options.arrayMerge || defaultArrayMerge

  if (array) {
    return Array.isArray(target) ?
      arrayMerge(target, source, optionsArgument) :
      cloneIfNecessary(source, optionsArgument)
  }
  else {
    return mergeObject(target, source, optionsArgument)
  }
}

deepmerge.all = function deepmergeAll(array, optionsArgument) {
  if (!Array.isArray(array) || array.length < 2) {
    throw new Error(
      'first argument should be an array with at least two elements'
    )
  }

  // we are sure there are at least 2 values, so it is safe to have no initial value
  return array.reduce((prev, next) => {
    return deepmerge(prev, next, optionsArgument)
  })
}

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
    stringToArray: true,
    boolToArray: false,
    boolAsRight: true,
    ignoreTypes: ['null', 'undefined', 'NaN'],
    debug: true,
  }
}

// require('fliplog').fmtobj({types, options, obj1, obj2}).echo(false)
// require('fliplog')
//   .data({
//     boolbool: eq(['boolean', 'boolean']),
//     strstr: eq(['string', 'string']),
//     arrstr: eq(['array', 'string']),
//     strarr: eq(['string', 'array']),
//   })
//   .echo()

function getOpts(opts) {
  const defaults = getDefaults()
  const options = Object.assign(defaults, opts)
  return options
}

const isArr = Array.isArray
function dopemerge(obj1, obj2, opts = {}) {
  // if they are identical, fastest === check
  if (obj1 === obj2) return obj1

  // setup options
  const {ignoreTypes, stringToArray, boolToArray} = getOpts(opts)

  // setup vars
  let type1 = typeof obj1
  let type2 = typeof obj2
  if (isArr(obj1)) type1 = 'array'
  if (isArr(obj2)) type2 = 'array'
  const types = [type1, type2]

  // check one then check the other
  // @TODO might want to push undefined null nan into array but...
  if (ignoreTypes.includes(type1) === true) return obj2
  if (ignoreTypes.includes(type2) === true) return obj1

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
      return obj1.concat([obj2])
    }
    case eq(['string', 'array']): {
      return obj2.concat([obj1])
    }
    default: {
      return deepmerge(obj1, obj2)
    }
  }
}

module.exports = dopemerge
