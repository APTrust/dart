const isArr = Array.isArray
const isObj = o => o && typeof o === 'object'

function defaultKeyFn({val, i, array, obj}) {
  // if (typeof val === 'object') {
  //   obj = Object.assign(obj, val)
  // } else if (typeof val === 'string') { }
  return val
}
function defaultValFn({val, i, array, obj}) {
  return val
}

// array items become object values,
// fn maps items to keys
function arrToObj(array, keyValFns = {}) {
  const key = keyValFns.keyFn || defaultKeyFn
  const val = keyValFns.valFn || defaultValFn

  const obj = {}
  if (!isArr(array) && isObj(array)) return array
  const len = array.length
  for (let i = 0; i < len; i++) {
    const _val = val({val: array[i], i, array, obj})
    const _key = key({val: _val, i, array, obj})
    obj[_key] = _val
  }
  return obj
}

// @example:
// var array = ['eh', 'canada']
// valAsKey(array, 'woot')
// {eh: 'woot', canada: 'woot'}
function valAsKey(array, fn) {
  return arrToObj(array, {
    valFn: () => undefined,
    keyFn: ({i}) => (typeof fn === 'function' ? fn(i) : fn || array[i]),
  })
}

// @example:
// var array = ['eh', 'canada']
// valAsVal(array)
// {'1': 'eh', '2': 'canada'}
function valAsVal(array, fn) {
  return arrToObj(array, {
    valFn: ({i, val}) => (typeof fn === 'function' ? fn(val, i) : fn || i),
    keyFn: () => undefined,
  })
}

// is default...
function valAsKeyAndVal(array, fn) {
  return arrToObj(array, {
    valFn: defaultValFn,
    keyFn: defaultKeyFn,
  })
}

// function valAsValAndKey(array, fn) {}

arrToObj.valAsKey = valAsKey
arrToObj.valAsVal = valAsVal
arrToObj.valAsKeyAndVal = valAsKeyAndVal

module.exports = arrToObj
