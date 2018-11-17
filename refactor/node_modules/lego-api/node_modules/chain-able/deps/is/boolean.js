const toS = require('./toS')

module.exports = obj =>
  obj === true || obj === false || toS(obj) === '[object Boolean]'
