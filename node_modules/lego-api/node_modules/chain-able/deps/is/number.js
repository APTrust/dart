const toS = require('./toS')

module.exports = obj =>
  toS(obj) === '[object Number]' ||
  (/^0x[0-9a-f]+$/i).test(obj) ||
  (/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/).test(obj)
