import _get from 'lodash.get'

function getProperty(obj, name) {
  name = name.split('.')
  for (var i = 0; i < name.length - 1; i++) {
    obj = obj[name[i]]
    if (typeof obj !== 'object' || !obj) return
  }
  return obj[name.pop()]
}

function setProperty(obj, name, value) {
  name = name.split('.')
  for (var i = 0; i < name.length - 1; i++) {
    if (typeof obj[name[i]] !== 'object' && typeof obj[name[i]] !== 'undefined')
      return
    if (!obj[name[i]]) obj[name[i]] = {}
    obj = obj[name[i]]
  }
  obj[name.pop()] = value
}
