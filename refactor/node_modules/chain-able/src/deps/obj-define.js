// @TODO can be a chainable class xD
function objDefine() {}

objDefine.value = function objectDefineValue(
  obj,
  name,
  value,
  configurable = true,
  enumerable = false
) {
  Object.defineProperty(obj, name, {
    configurable,
    enumerable,
    value,
  })
  return objDefine
}

objDefine.getset = function objectDefineValue(
  obj,
  name,
  set,
  get,
  configurable = true,
  enumerable = false
) {
  Object.defineProperty(obj, name, {
    configurable,
    enumerable,
    set,
    get,
  })
  return objDefine
}

const getset = objDefine.getset

module.exports = objDefine
